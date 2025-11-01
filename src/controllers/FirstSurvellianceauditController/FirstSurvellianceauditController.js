
import Certification from "../../models/CertificationModel/CertificationModel.js";

export const firstSurveillance = async (req, res) => {
  try {
    const today = new Date();
    const next60Days = new Date();
    next60Days.setDate(today.getDate() + 60);

    // ✅ Find certifications whose first surveillance date is within the next 60 days
    const upcomingFirstSurveillance = await Certification.find({firstSurveillanceStatus:"Pending"}).select("companyName certificationNumber firstSurveillanceAudit email attachment logo");

    // ✅ Add remaining days for each certification
    const certificationsWithRemainingDays = upcomingFirstSurveillance.map((cert) => {
      const auditDate = new Date(cert.firstSurveillanceAudit);
      const diffTime = auditDate - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        companyName: cert.companyName,
        certificationNumber: cert.certificationNumber,
        firstSurveillanceAudit: cert.firstSurveillanceAudit,
        remainingDays,
        email: cert.email,
        attachment: cert.attachments,
        logo: cert.logo,
        CertificationId:cert._id
      };
    });

    res.status(200).json({
      success: true,
      message: "Certifications with first surveillance due within the next 60 days",
      total: certificationsWithRemainingDays.length,
      certifications: certificationsWithRemainingDays,
    });
  } catch (error) {
    console.error("Error fetching first surveillance data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching first surveillance data",
      error: error.message,
    });
  }
};



export const filterFirstSurveillance = async (req, res) => {
  try {
    const { companyName, email, certificationNumber, status, fromDate, toDate } = req.query;

    const filter = {};

    // 🔍 Filter by companyName, email, or certificationNumber
    if (companyName) {
      filter.companyName = { $regex: companyName, $options: "i" };
    }
    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }
    if (certificationNumber) {
      filter.certificationNumber = { $regex: certificationNumber, $options: "i" };
    }

    // 📅 Filter by active/inactive status
    if (status) {
      const today = new Date();
      if (status.toLowerCase() === "active") {
        filter.certificationExpiryDate = { $gte: today };
      } else if (status.toLowerCase() === "inactive") {
        filter.certificationExpiryDate = { $lt: today };
      }
    }

    // 📆 Filter by first surveillance date range
    if (fromDate && toDate) {
      filter.firstSurveillanceAudit = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // ✅ Fetch certifications
    const certifications = await Certification.find(filter).select(
      "companyName certificationNumber firstSurveillanceAudit email attachment logo certificationExpiryDate"
    );

    // ✅ Add remaining days
    const today = new Date();
    const certificationsWithRemainingDays = certifications.map((cert) => {
      const auditDate = new Date(cert.firstSurveillanceAudit);
      const diffTime = auditDate - today;
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        companyName: cert.companyName,
        certificationNumber: cert.certificationNumber,
        firstSurveillanceAudit: cert.firstSurveillanceAudit,
        remainingDays,
        email: cert.email,
        attachment: cert.attachments,
        logo: cert.logo,
        certificationId : cert._id
      };
    });

    res.status(200).json({
      success: true,
      message: "Filtered certifications fetched successfully",
      total: certificationsWithRemainingDays.length,
      certifications: certificationsWithRemainingDays,
    });
  } catch (error) {
    console.error("Error filtering first surveillance data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while filtering first surveillance data",
      error: error.message,
    });
  }
};


