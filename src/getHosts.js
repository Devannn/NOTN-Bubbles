const NTOPNG_HOST = "192.168.1.148";
const NTOPNG_PORT = "3000";
const IFID = "1";
const AUTH = "admin:nN38vvDU";

async function getHostIPs() {
    try {
        const response = await fetch(
            `http://${NTOPNG_HOST}:${NTOPNG_PORT}/lua/rest/v2/get/host/custom_data.lua?ifid=${IFID}`,
            {
                headers: {
                    'Authorization': `Basic ${btoa(AUTH)}`
                }
            }
        );

        const data = await response.json();
        console.log('API Response:', data);

        // Extract and filter IPs for 192.168.1.x
        if (data && data.rsp && data.rsp.data) {
            const hosts = data.rsp.data
                .filter(host => host.ip && host.ip.startsWith('192.168.1.'))
                .map(host => host.ip);

            console.log('Filtered IPs:', hosts);
            return hosts;
        }
        return [];
    } catch (error) {
        console.error('Error fetching hosts:', error);
        return [];
    }
}

// Example usage
getHostIPs().then(ips => {
    console.log('Final IP array:', ips);
});

export default getHostIPs; 