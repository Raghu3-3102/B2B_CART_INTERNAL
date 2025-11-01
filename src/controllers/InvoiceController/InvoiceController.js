import Invoice from "../../models/InvoiceModel/InvoiceModel.js";


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
      terms: typeof terms === "string" ? JSON.parse(terms) : terms, // ✅ FIX
      attachments,
    });

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
    await Invoice.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};
