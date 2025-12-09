import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
import ComponyModel from "../../models/componyModel/ComponyModel.js";
import Standard from "../../models/StandardModel/StandardModel.js";
import mongoose from "mongoose";
/**
. * ✅ Create Invoice (with file upload)
 */

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      currency,
      agentId,
      companyName,
      companyId,
      email,
      alternateEmails,
      phone,
      country,
      city,
      address,
      website,
      componyDetails,
      InvoiceDate,
      gstNumber,
      ClientName,
      SacCode,
      certificationType,
      standard,
      baseClosureAmount,
      baseClosureAmountINR,
      exchangeRateForBaseClosure,
      moneyReceived,
      paymentInstallments,
      terms,
      TotalBaseAmount,
      TotalGSTAmount,
      TotalTDSAmount,
      GrandTotalBaseAmmount,
      PendingPaymentInINR
    } = req.body;

    // ---------- standard (array) ----------
    const standards = Array.isArray(standard)
      ? standard
      : typeof standard === "string" && standard.length
      ? JSON.parse(standard)
      : [];

    // ---------- terms parse ----------
    const parsedTerms = typeof terms === "string" ? JSON.parse(terms) : (terms || []);

    const updatedTerms = parsedTerms.map(term => {
      if (currency === "INR") {
        return {
          termName: term.termName,
          baseAmount: term.baseAmount,
          gstPercentage: term.gstPercentage,
          gstAmount: term.gstAmount,
          TDSAmmount: term.TDSAmmount,
          termTotal: term.termTotal,
          status: term.status || "Pending",
        };
      }
      return {
        termName: term.termName,
        baseAmount: term.baseAmount,
        termTotal: term.termTotal,
        exchangeRate: term.exchangeRate,
        totalInINR: term.totalInINR,
        status: term.status || "Pending",
      };
    });

    // ---------- attachments ----------
    const attachments =
      req.files?.attachments?.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      })) || [];

    // ---------- CREATE INVOICE ----------
    let invoiceDat = await Invoice.create({
      invoiceNo,
      currency,
      agentId,
      companyId,
      companyName,
      email,
      alternateEmails,
      phone,
      country,
      city,
      address,
      website,
      componyDetails,
      InvoiceDate,
      gstNumber,
      ClientName,
      SacCode,
      certificationType,
      standard: standards,
      baseClosureAmount,

      // NEW FIELDS stay safe
      baseClosureAmountINR: currency !== "INR" ? baseClosureAmountINR : undefined,
      exchangeRateForBaseClosure: currency !== "INR" ? exchangeRateForBaseClosure : undefined,

      moneyReceived,
      paymentInstallments,
      terms: updatedTerms,
      TotalBaseAmount,
      TotalGSTAmount,
      TotalTDSAmount,
      GrandTotalBaseAmmount,
      PendingPaymentInINR,
      attachments,
    });

    // ======================================================
    //  1️⃣ UPDATE AGENT
    // ======================================================
    const agentData = await Agent.findById(agentId);
    if (agentData) {
      agentData.InvoiceCount = (agentData.InvoiceCount || 0) + 1;
      agentData.InvoiceIds.push(invoiceDat._id);
      await agentData.save();
    }

    // ======================================================
    //  2️⃣ UPDATE COMPANY
    // ======================================================
    if (companyId) {
      const comp = await ComponyModel.findById(companyId);
      if (comp) {
        comp.invoiceCount = (comp.invoiceCount || 0) + 1;
        comp.invoiceIds.push(invoiceDat._id);
        await comp.save();
      }
      invoiceDat.companyId = companyId;
    } else {
      const newCompany = await ComponyModel.create({
        companyName,
        status: "Active",
        invoiceCount: 1,
        invoiceIds: [invoiceDat._id],
      });
      invoiceDat.companyId = newCompany._id;
    }

    /** 🔥 FIXED: DO NOT OVERWRITE DOCUMENT */
    await invoiceDat.save();

    // ======================================================
    //  3️⃣ TARGET ACHIEVED LOGIC
    // ======================================================
    const amountToAdd = Number(baseClosureAmount) || 0;

    const existingOther = await Invoice.findOne({
      _id: { $ne: invoiceDat._id },
      agentId,
      companyId: invoiceDat.companyId,
      standard: { $in: standards },
    });

    if (!existingOther && amountToAdd > 0) {
      await Agent.findByIdAndUpdate(agentId, {
        $inc: { targetAchieved: currency !== "INR" ? baseClosureAmountINR : amountToAdd},
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: invoiceDat,
    });

  } catch (error) {
    console.error("Create Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};






export const getInvoiveByStanderdandcomponyName = async (req, res) => {
  try {
    const { standard, companyId } = req.params;
    // console.log("Standard:", standard, "Company ID:", companyId);
    const invoices = await Invoice.find({
      standard: standard,
      companyId: companyId,
    }).populate("agentId").populate("componyDetails").populate("standard");  
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};





/**
 * ✅ Get All Invoices
 */
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("agentId").populate("componyDetails").populate("standard");
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Get Invoice By ID
 */

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("agentId")
      .populate("componyDetails")
      .populate("standard");

    if (!invoice)
      return res.status(404).json({ message: "Invoice not found" });

    // ------------------------------
    // Extract required matching fields
    // ------------------------------
    const companyId = invoice.companyId;

    // Convert standard STRING IDs → ObjectId
    const standardList = invoice.standard.map(id =>
      new mongoose.Types.ObjectId(id)
    );

    // ------------------------------
    // Find all invoices of same company + same standard
    // Exclude THIS invoice (_id != req.params.id)
    // ------------------------------
    const relatedInvoices = await Invoice.find({
      companyId: companyId,
      standard: { $in: standardList },
      _id: { $ne: req.params.id },
    })
      .populate("agentId")
      .populate("componyDetails")
      .populate("standard");

    return res.status(200).json({
      success: true,
      invoice,
      relatedInvoices,
    });

  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};




/**
 * ✅ Update Invoice (with optional new files)
 */
export const updateInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // ✅ Fetch existing invoice before update
    const existingInvoice = await Invoice.findById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const updateData = { ...req.body };

    // ✅ Convert terms if string (form-data case)
    if (req.body.terms && typeof req.body.terms === "string") {
      updateData.terms = JSON.parse(req.body.terms);
    }

    // ✅ Handle new attachments (optional)
    if (req.files?.attachments?.length > 0) {
      updateData.attachments = req.files.attachments.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      }));
    }

    // ✅ Handle Agent Change
    // ✅ Update agent mapping on invoice update
if (req.body.agentId && existingInvoice.agentId?.toString() !== req.body.agentId) {

  // Fetch old agent only if exists
  const oldAgent = existingInvoice.agentId
    ? await Agent.findById(existingInvoice.agentId)
    : null;

  // Fetch new agent
  const newAgent = await Agent.findById(req.body.agentId);

  // ✅ Remove invoice from old agent
  if (oldAgent) {
    oldAgent.InvoiceCount = Math.max(0, (oldAgent.InvoiceCount || 0) - 1);
    oldAgent.InvoiceIds = oldAgent.InvoiceIds.filter(
      invId => invId.toString() !== invoiceId
    );
    await oldAgent.save();
  }

  // ✅ Add invoice to new agent
  if (newAgent) {
    newAgent.InvoiceCount = (newAgent.InvoiceCount || 0) + 1;
    newAgent.InvoiceIds.push(invoiceId);
    await newAgent.save();
  }
}


    // ✅ Update invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully ✅",
      updatedInvoice,
    });

  } catch (error) {
    console.error("❌ Update Invoice Error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};




/**
 * ✅ Delete Invoice
 * (Cloudinary files remain stored — delete via portal if required)
 */
export const deleteInvoice = async (req, res) => {
  try {
    const id = req.params.id;

    // ✅ Get invoice BEFORE deleting
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const agentId = invoice.agentId;
    const companyId = invoice.companyId;

    // ✅ Delete invoice
    await Invoice.findByIdAndDelete(id);
    
    if(companyId){
      const company = await ComponyModel.findById(companyId);
      if(company){
        company.invoiceCount = Math.max(0,company.invoiceCount - 1);
        company.invoiceIds = company.invoiceIds.filter(
          (invId) => invId.toString() !== id
        );
        await company.save();
      }
    }

    // ✅ Delete invoice
    await Invoice.findByIdAndDelete(id);

    // ✅ Remove Invoice reference from Agent
    if (agentId) {
      const agent = await Agent.findById(agentId);
      if (agent) {
        agent.InvoiceCount = Math.max(0, agent.InvoiceCount - 1);
        agent.InvoiceIds = agent.InvoiceIds.filter(
          (invId) => invId.toString() !== id
        );
        await agent.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully ✅"
    });

  } catch (error) {
    console.error("❌ Delete Invoice Error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};

export const getInvoicesFilter = async (req, res) => {
    try {
      const {
        search,
        companyName,
        agentId,
        status,
        currency,
        city,
        country,
        standard,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;
  
      const filter = {};
  
      /* ------------------ 🔍 GLOBAL SEARCH ------------------ */
      if (search) {
        filter.$or = [
          { companyName: { $regex: search, $options: "i" } },
          { invoiceNo: { $regex: search, $options: "i" } },
        ];
  
        /** 🔍 Search by Agent Name */
        const matchedAgents = await Agent.find({
          agentName: { $regex: search, $options: "i" }
        }).select("_id");
  
        if (matchedAgents.length > 0) {
          filter.$or.push({ agentId: { $in: matchedAgents.map(a => a._id) } });
        }
  
        /** 🔍 Search by Standard Name */
        const matchedStandards = await Standard.find({
          standardName: { $regex: search, $options: "i" }
        }).select("standardName");
  
        if (matchedStandards.length > 0) {
          filter.$or.push({ standard: { $in: matchedStandards.map(s => s.standardName) } });
        }
      }
  
      /* ------------------ SIMPLE FILTERS ------------------ */
      if (companyName) filter.companyName = companyName;
  
      /** 🔍 If agentId is ID or name */
      if (agentId) {
        const agentDoc = await Agent.findOne({
          $or: [
            { _id: agentId },
            { agentName: { $regex: agentId, $options: "i" } }
          ]
        });
  
        if (agentDoc) filter.agentId = agentDoc._id;
      }
  
      /** 🔍 If standard field contains name or ID */
      if (standard) {
        const stdDoc = await Standard.findOne({
          $or: [
            { standardName: { $regex: standard, $options: "i" } },
            { _id: standard }
          ]
        });
  
        if (stdDoc) filter.standard = stdDoc.standardName;
      }
  
      if (status) filter.status = status;
      if (currency) filter.currency = currency;
      if (city) filter.city = city;
      if (country) filter.country = country;
  
      /* ------------------ DATE RANGE ------------------ */
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.InvoiceDate.$gte = new Date(startDate);
        if (endDate) filter.InvoiceDate.$lte = new Date(endDate);
      }
  
      /* ------------------ PAGINATION ------------------ */
      const skip = (page - 1) * limit;
  
      const invoices = await Invoice.find(filter)
        .populate("agentId")
        .populate("companyId")
        .populate("componyDetails")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));
  
      const total = await Invoice.countDocuments(filter);
  
      res.status(200).json({
        total,
        page,
        limit,
        invoices,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching invoice list",
        error: error.message,
      });
    }
};

export const getInvoiveByStandrdAndComponyAsATrue = async (req, res) => {
  try {
    const { standard, companyId } = req.params;

    // console.log("Standard:", standard, "Company ID:", companyId);

    // ✅ First update ALL invoices matching standard + companyId
    await Invoice.updateMany(
      { standard: standard, companyId: companyId },
      { $set: {IsCompleted: true } }
    );

    // ✅ Then fetch updated invoices
    const invoices = await Invoice.find({
      standard: standard,
      companyId: companyId,
    })
      .populate("agentId")
      .populate("componyDetails")
      .populate("standard");

    return res.status(200).json({
      success: true,
      message: "All invoices updated with IsCompleted: true",
      invoices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


export const getInvoiveByStandrdAndComponyAsAFalse = async (req, res) => {
  try {
    const { standard, companyId } = req.params;

    // console.log("Standard:", standard, "Company ID:", companyId);

    // ✅ First update ALL invoices matching standard + companyId
    await Invoice.updateMany(
      { standard: standard, companyId: companyId },
      { $set: {IsCompleted: false } }
    );

    // ✅ Then fetch updated invoices
    const invoices = await Invoice.find({
      standard: standard,
      companyId: companyId,
    })
      .populate("agentId")
      .populate("componyDetails")
      .populate("standard");

    return res.status(200).json({
      success: true,
      message: "All invoices updated with IsCompleted: true",
      invoices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


