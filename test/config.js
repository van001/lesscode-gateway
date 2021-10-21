module.exports = {
    local: 'http://localhost:8091',
    dev: 'https://dev.albertinventdev.com',
    authHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQ2LCJlbWFpbCI6ImVuZ2luZWVyaW5nQGFsYmVydGludmVudC5jb20iLCJ1c2VyVHlwZUlkIjoxLCJuYW1lIjoiU3VwZXIgQWRtaW4iLCJpc1Rva2VuVmVyaWZpZWQiOjEsImlhdCI6MTYxNzA0OTA4NH0.n1WxvHkvACAzpquRSBQxTjVDJx2LYVpLdvTVJtQieY4',
    name: 'jwtuser',
    tenantId: 'TEN1',

    params: {
        'postInventory': {
            token: 'Bearer 123',
            url: 'http://localhost:8090',
            path: '/api/v3/inventories',
            required: { 
                name : 'name', 
                description : 'description', 
                companyId : 'companyId', 
                category: 'category',
                unitCategory :  'unitCategory' }
        }

    }
}