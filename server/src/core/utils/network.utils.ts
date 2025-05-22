import { networkInterfaces } from 'os';

export interface NetworkInfo {
  local: string;
  network: string | null;
  interfaces: Array<{
    name: string;
    address: string;
    family: string;
    internal: boolean;
  }>;
}

export const getNetworkInfo = (): NetworkInfo => {
  const interfaces = networkInterfaces();
  const allInterfaces: NetworkInfo['interfaces'] = [];
  let networkIP: string | null = null;

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses) continue;

    for (const address of addresses) {
      allInterfaces.push({
        name,
        address: address.address,
        family: address.family,
        internal: address.internal,
      });

      // Trova il primo IP non-loopback IPv4
      if (address.family === 'IPv4' && !address.internal && !networkIP) {
        networkIP = address.address;
      }
    }
  }

  return {
    local: 'localhost',
    network: networkIP,
    interfaces: allInterfaces,
  };
};

export const logNetworkInfo = (port: number | string, apiPrefix: string = '') => {
  const networkInfo = getNetworkInfo();
  
  console.log('\n🚀 Server avviato con successo!');
  console.log('📍 Accesso locale:');
  console.log(`   http://localhost:${port}${apiPrefix}`);
  
  if (networkInfo.network) {
    console.log('🌐 Accesso da rete locale:');
    console.log(`   http://${networkInfo.network}:${port}${apiPrefix}`);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔧 Interfacce di rete disponibili:');
    networkInfo.interfaces
      .filter(iface => iface.family === 'IPv4')
      .forEach(iface => {
        const type = iface.internal ? '(loopback)' : '(network)';
        console.log(`   ${iface.name}: ${iface.address} ${type}`);
      });
  }
  
  console.log('\n');
};