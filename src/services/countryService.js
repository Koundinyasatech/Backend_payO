const connectDB = require("../config/db");

exports.getCountries = async () => {
    const pool = await connectDB();

    const result = await pool
        .request()
        .execute("GetCountryProvinceListJson");

    if (!result.recordset || result.recordset.length === 0) {
        return [];
    }

    const jsonColumn = Object.keys(result.recordset[0])[0];

    return JSON.parse(result.recordset[0][jsonColumn]);
};