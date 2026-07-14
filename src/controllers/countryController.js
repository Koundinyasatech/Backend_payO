const countryService = require("../services/countryService");

exports.getCountries = async (req, res) => {
    try {

        const countries = await countryService.getCountries();

        return res.status(200).json({
            status: "200",
            message: "Countries fetched successfully",
            data: countries
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            status: "500",
            message: err.message
        });

    }
};