// Sample config file. Create on for you app/ cluster name -
// e.g. : api-auth.dev.config.json
module.exports = {
    rest: {
        port: 8090
    },
    ZENDESK_TOKEN : `${process.env.ZENDESK_TOKEN}`,
    JWT_TOKEN_SECRET : `${process.env.SCIM_JWT_TOKEN}`
}