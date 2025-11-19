import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
import ComponyModel from "../../models/componyModel/ComponyModel.js";
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
    const invoice = await Invoice.findById(req.params.id).populate("agentId").populate("componyDetails");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, error });
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

