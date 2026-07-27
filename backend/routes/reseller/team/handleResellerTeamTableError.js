const handleResellerTeamTableError = (res, error, logLabel) => {
  if (error?.code === "P2021" && error?.meta?.modelName === "ResellerMember") {
    console.warn(`${logLabel} TABLE MISSING:`, error.meta);
    return res.status(503).json({
      status: 0,
      message:
        "Reseller team module is unavailable because the ResellerMember table has not been migrated yet.",
      statusCode: 503,
      data: {
        migrationRequired: true,
        missingModel: "ResellerMember",
      },
    });
  }

  return null;
};

module.exports = handleResellerTeamTableError;
