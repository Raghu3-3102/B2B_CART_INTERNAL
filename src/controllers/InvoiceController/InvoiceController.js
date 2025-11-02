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

    // ✅ AUTO CALCULATIONS BASED ON CURRENCY
    // ✅ AUTO CALCULATIONS BASED ON CURRENCY
const updatedTerms = parsedTerms.map((term) => {
  if (currency === "INR") {
    // GST Calculation
    const gstAmt = (term.baseAmount * term.gstPercentage) / 100;
    const termTotal = term.baseAmount + gstAmt - (term.TDSAmmount || 0);

    return {
      ...term,
      gstAmount: gstAmt,
      termTotal,
      exchangeRate: undefined,
      totalInINR: undefined,
    };
  } else {
    // NON INR Case
    const totalInINR = term.termTotal * term.exchangeRate;

    // ✅ REMOVE GST/TDS FIELDS FOR NON-INR
    delete term.gstPercentage;
    delete term.gstAmount;
    delete term.TDSAmmount;

    return {
      ...term,
      totalInINR,
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

    // ✅ Agent Invoice count update
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
    return res.status(500).json({ success: false, message: "Server Error", error });
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

    const updateData = { ...req.body };

    console.log("📥 Received Body:", req.body);

    if (req.files && req.files.length > 0) {
      updateData.attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
      }));
    }

    // ✅ FIX → Do NOT parse terms if already an object
    if (req.body.terms && typeof req.body.terms === "string") {
      updateData.terms = JSON.parse(req.body.terms);
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
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

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};



/**
 * ✅ Delete Invoice
 * (Cloudinary files remain stored — delete via portal if required)
 */
export const deleteInvoice = async (req, res) => {
  try {
   const data =  await Invoice.findByIdAndDelete(req.params.id);
        const { agentId } = await Invoice.findById(req.params.id);
    if (agentId) {
          const agent = await Agent.findById(agentId);
          if (agent) {
            agent.InvoiceCount = Math.max(0, agent.InvoiceCount - 1); // prevent negative count
            agent.InvoiceIds = agent.InvoiceIds.filter(
              (companyId) => companyId.toString() !== id
            );
            await agent.save();
          }
        }
    return res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};
