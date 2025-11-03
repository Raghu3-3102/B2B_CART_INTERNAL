import Invoice from "../../models/InvoiceModel/InvoiceModel.js";
import Agent from "../../models/AgentModel/AgentModel.js";

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
      email,
      alternateEmails,
      phone,
      country,
      city,
      address,
      website,
      gstNumber,
      standard,
      baseClosureAmount,
      moneyReceived,
      paymentInstallments,
      terms,
    } = req.body;

    const parsedTerms =
      typeof terms === "string" ? JSON.parse(terms) : terms;

    const updatedTerms = parsedTerms.map((term) => {
      if (currency === "INR") {
        const gstAmt = (term.baseAmount * term.gstPercentage) / 100;
        const termTotal =
          term.baseAmount + gstAmt - (term.TDSAmmount || 0);

        return {
          termName: term.termName,
          baseAmount: term.baseAmount,
          gstPercentage: term.gstPercentage,
          gstAmount: gstAmt,
          TDSAmmount: term.TDSAmmount,
          termTotal,
          status: term.status || "Pending",
        };
      } else {
        const totalInINR = term.termTotal * term.exchangeRate;

        return {
          termName: term.termName,
          baseAmount: term.baseAmount,
          termTotal: term.termTotal,
          exchangeRate: term.exchangeRate,
          totalInINR,
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

    const newInvoice = new Invoice({
      invoiceNo,
      currency,
      agentId,
      companyName,
      email,
      alternateEmails,
      phone,
      country,
      city,
      address,
      website,
      gstNumber,
      standard,
      baseClosureAmount,
      moneyReceived,
      paymentInstallments,
      terms: updatedTerms,
      attachments,
    });

    // ✅ Update agent invoice count
    const agentData = await Agent.findById(agentId);
    if (agentData) {
      agentData.InvoiceCount = (agentData.InvoiceCount || 0) + 1;
      agentData.InvoiceIds = [...(agentData.InvoiceIds || []), newInvoice._id];
      await agentData.save();
    }

    await newInvoice.save();

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
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate("agentId");
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
    const invoice = await Invoice.findById(req.params.id).populate("agentId");
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
    if (req.body.agentId && req.body.agentId !== existingInvoice.agentId.toString()) {
      const oldAgent = await Agent.findById(existingInvoice.agentId);
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
export const deleteInvoice = async (req, res) => {
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

