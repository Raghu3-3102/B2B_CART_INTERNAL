import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
import ComponyModel from "../../models/componyModel/ComponyModel.js";
import Standard from "../../models/StandardModel/StandardModel.js";
/**
 * ✅ Create Invoice (with file upload)
 */

export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      currency,
      agentId,
      companyName,
      companyId,   // <-- coming from request
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
      moneyReceived,
      paymentInstallments,
      terms,
      TotalBaseAmount,
      TotalGSTAmount,
      TotalTDSAmount,
      GrandTotalBaseAmmount,
      PendingPaymentInINR
    } = req.body;

    const parsedTerms =
      typeof terms === "string" ? JSON.parse(terms) : terms;

    const updatedTerms = parsedTerms.map((term) => {
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
      } else {
        return {
          termName: term.termName,
          baseAmount: term.baseAmount,
          termTotal: term.termTotal,
          exchangeRate: term.exchangeRate,
          totalInINR: term.totalInINR,
          status: term.status || "Pending",
        };
      }
    });

    const attachments =
      req.files?.attachments?.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      })) || [];

    // ✅ Invoice creation
    const newInvoice = new Invoice({
      invoiceNo,
      currency,
      agentId,
      companyId:companyId, // <-- storing here
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
      standard,
      baseClosureAmount,
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

    const invoiceDat = await newInvoice.save();

    // ✅ Agent invoice count update
    const agentData = await Agent.findById(agentId);
    if (agentData) {
      agentData.InvoiceCount = (agentData.InvoiceCount || 0) + 1;
      agentData.InvoiceIds.push(invoiceDat._id);
      await agentData.save();
    }

    // ✅ Company logic
    if (companyId) {
      // Existing company
      const companyData = await ComponyModel.findById(companyId);
      if (companyData) {
        companyData.invoiceCount += 1;
        companyData.invoiceIds.push(invoiceDat._id);
        await companyData.save();
      }
    } else {
      // Create new company
      const company = await ComponyModel.create({
        companyName,
        status: "Active",
        invoiceCount: 1,
        invoiceIds: [invoiceDat._id], // ✅ array fix
      });

      invoiceDat.companyId = company._id; // ✅ typo fix
      await invoiceDat.save();
    }



    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: invoiceDat,  // ✅ return updated invoice
    });
  } catch (error) {
    console.error("Create Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};


export const getInvoiveByStanderdandcomponyName = async (req, res) => {
  try {
    const { standard, companyId } = req.params;
    console.log("Standard:", standard, "Company ID:", companyId);
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
    const standardList = invoice.standard; // array

    // ------------------------------
    // Find all invoices of same company + same standard
    // Exclude THIS invoice (_id != req.params.id)
    // ------------------------------
    const relatedInvoices = await Invoice.find({
      companyId: companyId,
      standard: { $in: standardList },   // match any standard in array
      _id: { $ne: req.params.id }        // exclude current invoice
    })
      .populate("agentId")
      .populate("componyDetails");

    return res.status(200).json({
      success: true,
      invoice,
      relatedInvoices, // previous + similar invoices
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
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
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

    console.log("Standard:", standard, "Company ID:", companyId);

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


