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

export const ManagerMonthlyPerformance = (startDate, endDate) => {
  const pipeline = [
    // 1️⃣ Start from AGENTS (no manager filter)
    {
      $lookup: {
        from: "invoices",
        let: {
          agentId: "$_id"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$agentId", "$$agentId"]
                  },
                  {
                    $gte: [
                      "$createdAt",
                      new Date(
                        startDate
                      )
                    ]
                  },
                  {
                    $lt: [
                      "$createdAt",
                      new Date(
                        endDate
                      )
                    ]
                  }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$currency", "INR"]
                    },
                    "$baseClosureAmount",
                    "$baseClosureAmountINR"
                  ]
                }
              }
            }
          }
        ],
        as: "result"
      }
    },
    // 2️⃣ Flatten lookup result
    {
      $addFields: {
        total: {
          $ifNull: [
            {
              $arrayElemAt: ["$result.total", 0]
            },
            0
          ]
        }
      }
    },
    // 3️⃣ Group by MANAGER (this is the key change)
    {
      $group: {
        _id: "$manager",
        target: {
          $sum: "$target"
        },
        total: {
          $sum: "$total"
        }
      }
    },
    // 4️⃣ Calculate percentage per manager
    {
      $project: {
        _id: 0,
        manager: "$_id",
        target: 1,
        total: 1,
        percentage: {
          $cond: [
            {
              $eq: ["$target", 0]
            },
            0,
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: ["$total", "$target"]
                    },
                    100
                  ]
                },
                2
              ]
            }
          ]
        }
      }
    }
  ]

  return pipeline
}