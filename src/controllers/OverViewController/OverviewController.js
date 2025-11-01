import Certification from "../../models/CertificationModel/CertificationModel.js";
import Company from "../../models/componyModel/ComponyModel.js";

export const getDashboardOverview = async (req, res) => {
  try {
    const now = new Date();

    // Previous periods
    const lastMonth = new Date();
    lastMonth.setMonth(now.getMonth() - 1);

    const pastWeek = new Date();
    pastWeek.setDate(now.getDate() - 7);

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    // ---------------------- Total Companies ----------------------
    const totalCompanies = await Company.countDocuments();
    const totalCompaniesLastMonth = await Company.countDocuments({
      createdAt: { $lt: now, $gte: lastMonth },
    });
    const totalCompaniesChange = totalCompaniesLastMonth
      ? ((totalCompanies - totalCompaniesLastMonth) / totalCompaniesLastMonth) * 100
      : 0;

    // ---------------------- Total Certifications ----------------------
    const totalCertifications = await Certification.countDocuments();
    const totalCertificationsPastWeek = await Certification.countDocuments({
      createdAt: { $lt: now, $gte: pastWeek },
    });
    const totalCertificationsChange = totalCertificationsPastWeek
      ? ((totalCertifications - totalCertificationsPastWeek) / totalCertificationsPastWeek) * 100
      : 0;

    // ---------------------- Active Certifications ----------------------
    const activeCertifications = await Certification.countDocuments({ status: "Active" });
    const activeCertificationsLastMonth = await Certification.countDocuments({
      status: "Active",
      createdAt: { $lt: now, $gte: lastMonth },
    });
    const activeCertificationsChange = activeCertificationsLastMonth
      ? ((activeCertifications - activeCertificationsLastMonth) / activeCertificationsLastMonth) * 100
      : 0;

    // ---------------------- Expired Certifications ----------------------
    const expiredCertifications = await Certification.countDocuments({
      certificationExpiryDate: { $lt: now },
    });
    const expiredCertificationsYesterday = await Certification.countDocuments({
      certificationExpiryDate: { $lt: yesterday },
    });
    const expiredCertificationsChange = expiredCertificationsYesterday
      ? ((expiredCertifications - expiredCertificationsYesterday) / expiredCertificationsYesterday) * 100
      : 0;

    // ---------------------- 1st Surveillance Audits Due ----------------------
    const firstSurveillanceDue = await Certification.countDocuments({
      firstSurveillanceAudit: { $lte: now },
      status: "Active",
    });
    const firstSurveillancePastWeek = await Certification.countDocuments({
      firstSurveillanceAudit: { $lte: pastWeek },
      status: "Active",
    });
    const firstSurveillanceChange = firstSurveillancePastWeek
      ? ((firstSurveillanceDue - firstSurveillancePastWeek) / firstSurveillancePastWeek) * 100
      : 0;

    // ---------------------- 2nd Surveillance Audits Due ----------------------
    const secondSurveillanceDue = await Certification.countDocuments({
      secondSurveillanceAudit: { $lte: now },
      status: "Active",
    });
    const secondSurveillanceYesterday = await Certification.countDocuments({
      secondSurveillanceAudit: { $lte: yesterday },
      status: "Active",
    });
    const secondSurveillanceChange = secondSurveillanceYesterday
      ? ((secondSurveillanceDue - secondSurveillanceYesterday) / secondSurveillanceYesterday) * 100
      : 0;

    res.status(200).json({
      totalCompanies: {
        count: totalCompanies,
        change: totalCompaniesChange.toFixed(1) + "%",
        direction: totalCompaniesChange >= 0 ? "Up from Last Month" : "Down from Last Month"
      },
      totalCertifications: {
        count: totalCertifications,
        change: totalCertificationsChange.toFixed(1) + "%",
        direction: totalCertificationsChange >= 0 ? "Up from Past Week" : "Down from Past Week"
      },
      activeCertifications: {
        count: activeCertifications,
        change: activeCertificationsChange.toFixed(1) + "%",
        direction: activeCertificationsChange >= 0 ? "Up from Last Month" : "Down from Last Month"
      },
      expiredCertifications: {
        count: expiredCertifications,
        change: expiredCertificationsChange.toFixed(1) + "%",
        direction: expiredCertificationsChange >= 0 ? "Up from Yesterday" : "Down from Yesterday"
      },
      firstSurveillanceDue: {
        count: firstSurveillanceDue,
        change: firstSurveillanceChange.toFixed(1) + "%",
        direction: firstSurveillanceChange >= 0 ? "Up from Past Week" : "Down from Past Week"
      },
      secondSurveillanceDue: {
        count: secondSurveillanceDue,
        change: secondSurveillanceChange.toFixed(1) + "%",
        direction: secondSurveillanceChange >= 0 ? "Up from Yesterday" : "Down from Yesterday"
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getYearlyCertificationStats = async (req, res) => {
  try {
    const { year } = req.params; // input year from URL
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    // Expired certifications in this year
    const expiredCertifications = await Certification.countDocuments({
      certificationExpiryDate: { $gte: startOfYear, $lte: endOfYear },
    });

    // 1st Surveillance audits due in this year
    const firstSurveillanceDue = await Certification.countDocuments({
      firstSurveillanceAudit: { $gte: startOfYear, $lte: endOfYear },
      status: "Active",
    });

    // 2nd Surveillance audits due in this year
    const secondSurveillanceDue = await Certification.countDocuments({
      secondSurveillanceAudit: { $gte: startOfYear, $lte: endOfYear },
      status: "Active",
    });

    res.status(200).json({
      year,
      expiredCertifications,
      firstSurveillanceDue,
      secondSurveillanceDue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};







// Main controller
export const getCertificationStatsByPeriod = async (req, res) => {
  try {
    const { type, year } = req.query; // type=weekly|monthly|yearly
    const now = new Date();

    if (!type) return res.status(400).json({ message: "Type is required" });

    if (type === "yearly") {
      // Yearly stats, split by month
      if (!year) return res.status(400).json({ message: "year is required for yearly stats" });

      const results = [];
      for (let m = 0; m < 12; m++) {
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 0, 23, 59, 59, 999);

        const stats = await Certification.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
              inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } }
            }
          }
        ]);

        results.push({
          month: m + 1,
          total: stats[0]?.total || 0,
          active: stats[0]?.active || 0,
          inactive: stats[0]?.inactive || 0
        });
      }
      return res.status(200).json(results);
    }

    return res.status(400).json({ message: "Invalid type. Use weekly, monthly, or yearly" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getMonthlyCertificationStats = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const monthIndex = parseInt(month) - 1;
    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const weeks = [];
    const daysInMonth = endOfMonth.getDate();
    const weekSize = Math.ceil(daysInMonth / 4);

    for (let w = 0; w < 4; w++) {
      const startDay = w * weekSize + 1;
      const endDay = Math.min((w + 1) * weekSize, daysInMonth);

      const start = new Date(year, monthIndex, startDay);
      const end = new Date(year, monthIndex, endDay, 23, 59, 59, 999);

      const stats = await Certification.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } }
          }
        }
      ]);

      weeks.push({
        week: w + 1,
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        total: stats[0]?.total || 0,
        active: stats[0]?.active || 0,
        inactive: stats[0]?.inactive || 0
      });
    }

    return res.status(200).json(weeks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getTodayCertificationStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const stats = await Certification.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } }
        }
      }
    ]);

    return res.status(200).json({
      total: stats[0]?.total || 0,
      active: stats[0]?.active || 0,
      inactive: stats[0]?.inactive || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Get company registration count for a specific month
export const getCompanyRegistrationsByMonth = async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const monthIndex = parseInt(month) - 1; // 0-based index
    const startOfMonth = new Date(year, monthIndex, 1);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const count = await Company.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    return res.status(200).json({
      year,
      month,
      totalCompaniesRegistered: count,
      message: `Total companies registered in ${year}-${month}: ${count}`,
    });
  } catch (error) {
    console.error("Error fetching monthly company registration stats:", error);
    res.status(500).json({
      message: "Server error while fetching company registration count",
      error: error.message,
    });
  }
};

export const getCurrentWeekCertificationStats = async (req, res) => {
  try {
    const today = new Date();

    // 🗓️ Get Monday of current week
    const firstDayOfWeek = new Date(today);
    const dayOfWeek = firstDayOfWeek.getDay(); // 0 = Sunday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    firstDayOfWeek.setDate(today.getDate() + diffToMonday);
    firstDayOfWeek.setHours(0, 0, 0, 0);

    // 🗓️ Get Sunday of current week
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);

    const days = [];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(firstDayOfWeek);
      currentDay.setDate(firstDayOfWeek.getDate() + i);
      const start = new Date(currentDay.setHours(0, 0, 0, 0));
      const end = new Date(currentDay.setHours(23, 59, 59, 999));

      const stats = await Certification.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } },
          },
        },
      ]);

      const total = stats[0]?.total || 0;
      const active = stats[0]?.active || 0;
      const inactive = stats[0]?.inactive || 0;

      const activePercentage = total ? ((active / total) * 100).toFixed(2) : "0.00";
      const inactivePercentage = total ? ((inactive / total) * 100).toFixed(2) : "0.00";

      const dayName = start.toLocaleDateString("en-US", { weekday: "long" });

      days.push({
        date: start.toISOString().split("T")[0],
        day: dayName,
        total,
        active,
        inactive,
        activePercentage: `${activePercentage}%`,
        inactivePercentage: `${inactivePercentage}%`,
      });
    }

    return res.status(200).json({
      weekStart: firstDayOfWeek.toISOString().split("T")[0],
      weekEnd: lastDayOfWeek.toISOString().split("T")[0],
      days,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};





