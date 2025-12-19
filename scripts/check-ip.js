// Check your current public IP address
// This helps identify if VPN is changing your IP

const https = require('https')

console.log('🔍 Checking your current public IP address...')
console.log('(This is what MongoDB Atlas sees)\n')

// Check IP from multiple services
const services = [
  { name: 'ipify.org', url: 'https://api.ipify.org?format=json' },
  { name: 'ip-api.com', url: 'https://ip-api.com/json' },
]

services.forEach((service, index) => {
  https.get(service.url, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data)
        if (service.name === 'ipify.org') {
          console.log(`✅ Your public IP: ${json.ip}`)
          console.log(`\n💡 Add this IP to MongoDB Atlas → Network Access`)
        } else {
          console.log(`📍 Location: ${json.city || 'Unknown'}, ${json.country || 'Unknown'}`)
          console.log(`🌐 ISP: ${json.isp || 'Unknown'}`)
          if (json.proxy || json.hosting) {
            console.log(`⚠️  VPN/Proxy detected: ${json.proxy ? 'Yes' : 'No'}`)
            console.log(`⚠️  Hosting/VPN: ${json.hosting ? 'Yes' : 'No'}`)
          }
        }
        
        if (index === services.length - 1) {
          console.log('\n📝 Next steps:')
          console.log('1. Copy your IP address above')
          console.log('2. Go to MongoDB Atlas → Network Access')
          console.log('3. Click "Add IP Address"')
          console.log('4. Paste your IP and click "Confirm"')
          console.log('\nOR disconnect VPN and use your real IP')
        }
      } catch (e) {
        console.error(`Error parsing response from ${service.name}:`, e.message)
      }
    })
  }).on('error', (err) => {
    console.error(`Error checking IP from ${service.name}:`, err.message)
  })
})

