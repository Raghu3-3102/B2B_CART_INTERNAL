import Certification from "../../models/CertificationModel/CertificationModel.js";

// ✅ 1. Get certifications whose expiry date is within the next 60 days
export const ExpiringCertifications = async (req, res) => {
  try {
    const today = new Date();
    const next60Days = new Date();
    next60Days.setDate(today.getDate() + 60);

    // 🔍 Find certifications expiring in the next 60 days
    const upcomingExpiringCertifications = await Certification.find({
      certificationExpiryDate: {
        $gte: today,
        $lte: next60Days,
      },
    }).select(
      "companyName certificationNumber certificationExpiryDate email attachment logo"
    );

    // 🔢 Calculate remaining days
    const certificationsWithRemainingDays = upcomingExpiringCertifications.map((cert) => {
      const expiryDate = new Date(cert.certificationExpiryDate);
      const diffTime = expiryDate - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        companyName: cert.companyName,
        certificationNumber: cert.certificationNumber,
        certificationExpiryDate: cert.certificationExpiryDate,
        remainingDays,
        email: cert.email,
        attachment: cert.attachment,
        logo: cert.logo,
        certificationId: cert._id,
      };
    });

    res.status(200).json({
      success: true,
      message: "Certifications expiring within the next 60 days",
      total: certificationsWithRemainingDays.length,
      certifications: certificationsWithRemainingDays,
    });
  } catch (error) {
    console.error("Error fetching expiring certifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching expiring certifications",
      error: error.message,
    });
  }
};

// ✅ 2. Filter certifications by expiry info, company, email, or status
export const filterExpiringCertifications = async (req, res) => {
  try {
    const { companyName, email, certificationNumber, status, fromDate, toDate } = req.query;
    const filter = {};
    const today = new Date();

    // 🔍 Filter by companyName, email, certificationNumber
    if (companyName) filter.companyName = { $regex: companyName, $options: "i" };
    if (email) filter.email = { $regex: email, $options: "i" };
    if (certificationNumber)
      filter.certificationNumber = { $regex: certificationNumber, $options: "i" };

    // 📅 Filter by active/inactive status
    if (status) {
      if (status.toLowerCase() === "active") {
        filter.certificationExpiryDate = { $gte: today };
      } else if (status.toLowerCase() === "inactive") {
        filter.certificationExpiryDate = { $lt: today };
      }
    }

    // 📆 Filter by expiry date range
    if (fromDate && toDate) {
      filter.certificationExpiryDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // ✅ Fetch data
    const certifications = await Certification.find(filter).select(
      "companyName certificationNumber certificationExpiryDate email attachment logo"
    );

    // 🔢 Add remaining days
    const certificationsWithRemainingDays = certifications.map((cert) => {
      const expiryDate = new Date(cert.certificationExpiryDate);
      const diffTime = expiryDate - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        companyName: cert.companyName,
        certificationNumber: cert.certificationNumber,
        certificationExpiryDate: cert.certificationExpiryDate,
        remainingDays,
        email: cert.email,
        attachment: cert.attachment,
        logo: cert.logo,
        certificationId: cert._id,
      };
    });

    res.status(200).json({
      success: true,
      message: "Filtered certifications by expiry data",
      total: certificationsWithRemainingDays.length,
      certifications: certificationsWithRemainingDays,
    });
  } catch (error) {
    console.error("Error filtering expiring certifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while filtering expiring certifications",
      error: error.message,
    });
  }
};
