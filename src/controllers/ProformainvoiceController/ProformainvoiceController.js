import Invoice from "../../models/ProformainvoiceModel/ProformainvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";
import { permissionMiddleware } from "../../middleware/PermissionMidilewere.js";
import ComponyModel from "../../models/componyModel/ComponyModel.js";
/**
 * ✅ Create Invoice (with file upload)
 */

export const createProformaInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      currency,
      agentId,
      companyName,
      status,
      proformaInvoiceDate,
      companyId,
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
      paymentInstallments,
      terms,
      TotalBaseAmount,
      TotalGSTAmount,
      TotalTDSAmount,
      GrandTotalBaseAmount,
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
          TDSAmount: term.TDSAmount,
          termTotal:term.termTotal,
         
        };
      } else {
    

        return {
          termName: term.termName,
          baseAmount: term.baseAmount,
          termTotal: term.termTotal,
          exchangeRate: term.exchangeRate,
          totalInINR:term.totalInINR,
       
        };
      }
    });

    const attachments =
      req.files?.attachments?.map((file) => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      })) || [];

    const newInvoice = new Invoice({
      invoiceNo,
      currency,
      agentId,
      companyName,
      status,
      proformaInvoiceDate,
      companyId:companyId,
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
      paymentInstallments,
      terms: updatedTerms,
      TotalBaseAmount,
      TotalGSTAmount,
      TotalTDSAmount,
      GrandTotalBaseAmount,
      PendingPaymentInINR,
      attachments,
    });

    // ✅ Update agent invoice count
    const agentData = await Agent.findById(agentId);
    if (agentData) {
      agentData.InvoiceCount = (agentData.InvoiceCount || 0) + 1;
      agentData.InvoiceIds = [...(agentData.InvoiceIds || []), newInvoice._id];
      await agentData.save();
    }

    const newProformaInvoice =   await newInvoice.save();

      if (companyId) {
          // Existing company
          const companyData = await ComponyModel.findById(companyId);
          if (companyData) {
            companyData.ProformainvoiceCount += 1;
            companyData.ProformainvoiceIds.push(newProformaInvoice._id);
            await companyData.save();
          }
        } else {
          // Create new company
          const company = await ComponyModel.create({
            companyName,
            status: "Active",
            ProformainvoiceCount: 1,
            ProformainvoiceIds: [newProformaInvoice._id], // ✅ array fix
          });
    
          newProformaInvoice.companyId = company._id; // ✅ typo fix
          await newProformaInvoice.save();
        }



    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: newInvoice,
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





/**
 * ✅ Get All Invoices
 */
export const getAllProformaInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("agentId").populate("componyDetails");
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};


/**
 * ✅ Get Invoice By ID
 */
export const getProformaInvoiceById = async (req, res) => {
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
export const updateProformaInvoice = async (req, res) => {
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
      // ✅ Handle Agent Change (null-safe)
if (req.body.agentId && existingInvoice.agentId?.toString() !== req.body.agentId) {

  const oldAgent = existingInvoice.agentId ? await Agent.findById(existingInvoice.agentId) : null;
  const newAgent = await Agent.findById(req.body.agentId);

  if (oldAgent) {
    oldAgent.InvoiceCount = Math.max(0, oldAgent.InvoiceCount - 1);
    oldAgent.InvoiceIds = oldAgent.InvoiceIds.filter(
      (invId) => invId.toString() !== invoiceId
    );
    await oldAgent.save();
  }

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
export const deleteProformaInvoice = async (req, res) => {
  try {
    const id = req.params.id;

    // ✅ Get invoice BEFORE deleting
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const agentId = invoice.agentId;

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


export const editStatusProformaInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { status } = req.body;
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Invoice status updated successfully ✅",
      updatedInvoice,
    });
  } catch (error) {
    console.error("❌ Update Invoice Status Error:", error);
    return res.status(500).json({ success: false, message: "Server Error", error });
  }
};
