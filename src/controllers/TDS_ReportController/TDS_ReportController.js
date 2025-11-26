import Invoice from "../../models/InvoiceModel/InvoiceModel.js";


export const getTDSReport = async (req, res) => {
  try {
    const result = await Invoice.aggregate([
      // Only INR invoices
      {
        $match: { currency: "INR" }
      },

      // Calculate TDS of each invoice (sum of terms[])
      {
        $addFields: {
          tdsAmount: {
            $sum: {
              $map: {
                input: "$terms",
                as: "t",
                in: "$$t.TDSAmmount"
              }
            }
          }
        }
      },

      // Fetch company name
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "company"
        }
      },
      { $unwind: "$company" },

      // Only needed fields
      {
        $project: {
          _id: 0,
          companyId: "$companyId",
          standard: 1,
          invoiceNo: 1,
          companyName: "$company.companyName",
          tdsAmount: 1,
          createdAt: 1,
          currency: 1
        }
      },

      // GROUP invoices by companyId + standard
      {
        $group: {
          _id: {
            companyId: "$companyId",
            standard: "$standard"
          },
          invoices: { $push: "$$ROOT" },
          totalTdsForGroup: { $sum: "$tdsAmount" }
        }
      },

      // Final clean output
      {
        $project: {
          _id: 0,
          group: "$_id",
          invoices: 1,
          totalTdsForGroup: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

