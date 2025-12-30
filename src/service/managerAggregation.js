
export const getManagerWithTotal = (skipNum, limitNum) => {
  const skip = Number(skipNum);  
  const limit = Number(limitNum); 

  const pipeline = [
      {
        $lookup: {
          from: "agents",
          let: { managerId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$manager", "$$managerId"] } } },
            {
              $group: {
                _id: null,
                totalTarget: { $sum: "$target" }
              }
            }
          ],
          as: "stats"
        }
      },
      {
        $addFields: {
          totalTarget: { $ifNull: [{ $arrayElemAt: ["$stats.totalTarget", 0] }, 0] }
        }
      },
      {
        $project: { stats: 0, __v : 0 }
      },
      { $sort: { createdAt: -1 } },
    ]

    if (skipNum && skipNum > 0) {
      pipeline.push({ $skip: skipNum });
    }

    if (limitNum && limitNum > 0) {
      pipeline.push({ $limit: limitNum });
    }


    return pipeline
}
