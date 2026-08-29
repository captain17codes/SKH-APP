import fs from 'fs';
import path from 'path';

const ward4Records = [
  'Infrastructure,"What is the infrastructure of Ward 4?","Ward 4 (Yesgaon Bypass & Logistics Hub) has active road, water supply, drainage, streetlighting, waste management, healthcare, education, and open space infrastructure. Primary assets include the Yesgaon arterial bypass corridor, SCADA-monitored water supply network, concrete stormwater drains, 28 mapped streetlights, Kopargaon Sub-District Hospital, and Municipal Secondary School."',
  'Infrastructure,"Show Ward 4 infrastructure","Ward 4 infrastructure details include 6 mapped road segments (Yesgaon Bypass corridor), SCADA-monitored municipal water network, concrete stormwater drainage channels, 28 smart LED streetlights, Kopargaon Sub-District Hospital, Municipal Secondary School, 100% door-to-door solid waste collection, and commercial green buffer zones."',
  'Infrastructure,"What infrastructure does Ward 4 have?","Ward 4 features comprehensive road, water, drainage, street lighting, waste management, healthcare, and educational facilities. Key assets include the 4.8 sq km Yesgaon Bypass logistics corridor, SCADA water distribution, 28 streetlights, Sub-District Hospital, and municipal school."',
  'Infrastructure,"Ward 4 infrastructure details","Ward 4 has established infrastructure across roads, water distribution, drainage, lighting, health, education, and waste management. Major infrastructure includes the Yesgaon Bypass arterial road, Sub-District Hospital, 28 mapped streetlights, and SCADA water connections."',
  'Infrastructure,"Ward 4 ki infrastructure dikhao","Ward 4 mein sadak, paani supply, drainage, street lights, swasthya, aur shiksha ki suvidhaen uplabdh hain. Mukhya infrastructure mein Yesgaon Bypass road, SCADA water network, Kopargaon Sub-District Hospital, aur 28 smart streetlights shamil hain."',
  'Infrastructure,"Ward 4 madhe infrastructure kay aahe?","वॉर्ड ४ मध्ये रस्ते, पाणीपुरवठा, सांडपाणी निचरा, पथदिवे, आरोग्य आणि शिक्षण सुविधा उपलब्ध आहेत. मुख्य इन्फ्रास्ट्रक्चरमध्ये येसगाव बायपास रस्ता, SCADA पाणी नेटवर्क, कोपरगाव उप-जिल्हा रुग्णालय आणि २८ पथदिव्यांचा समावेश आहे."',
  'Infrastructure,"What are the infrastructure gaps in Ward 4?","Major infrastructure gaps in Ward 4 include road surface wear along the arterial Yesgaon Bypass logistics corridor, localized drainage bottlenecks near highway bypass junctions, and the requirement for expanded water distribution pipeline capacity for upcoming commercial logistics plots."',
  'Infrastructure,"What are the development priorities for Ward 4?","Key development priorities for Ward 4 are: 1) Resurfacing arterial logistics bypass roads, 2) Upgrading stormwater drainage channels along high-traffic bypass routes, and 3) Expanding SCADA water distribution pipeline capacity for expanding commercial plots."',
  'Infrastructure,"What is the road condition in Ward 4?","Ward 4 contains 6 mapped road segments including the primary arterial Yesgaon Bypass highway corridor. 3 road segments are designated for resurfacing and traffic junction safety improvements to support commercial logistics movement."',
  'Water,"What is the water supply schedule in Ward 4?","Ward 4 is connected to Kopargaon\'s SCADA-monitored water distribution network, receiving scheduled daily water distribution with planned pipeline capacity expansion for new commercial developments along the bypass corridor."',
  'Drainage,"What is the drainage system in Ward 4?","Ward 4 features mapped concrete stormwater drainage channels running along the Yesgaon Bypass corridor to manage monsoon runoff. Regular desilting and drain capacity expansion are prioritized for flood safety."',
  'Streetlights,"How is street lighting managed in Ward 4?","Ward 4 has 28 GIS-mapped smart LED streetlight poles positioned along major junctions and arterial bypass routes, monitored for continuous night illumination and energy efficiency."',
  'Waste Management,"What is the waste management coverage in Ward 4?","Ward 4 has 100% door-to-door solid waste collection coverage managed by Kopargaon Municipal Council, with segregated waste transport to central processing facilities."',
  'Healthcare,"What healthcare facilities exist in Ward 4?","Ward 4 is home to Kopargaon Sub-District Hospital located on Yesgaon Road, providing emergency trauma care, 24/7 outpatient services, and specialized civic healthcare."',
  'Education,"What educational facilities are available in Ward 4?","Ward 4 is serviced by Municipal Secondary School and local vocational institutes within 1.2 km, offering primary and higher secondary education for residents."',
  'Projects,"What smart city projects are active in Ward 4?","Active smart city projects in Ward 4 include PRJ-2026-004 (Yesgaon Bypass Road Resurfacing & Junction Safety Improvement) and PRJ-2026-009 (Ward 4 SCADA Water Distribution Pipeline Enhancement)."'
];

const paths = [
  path.resolve('c:/Users/chava/OneDrive/Desktop/SKH/kopargaon_smart_city_dataset.csv'),
  path.resolve('c:/Users/chava/OneDrive/Desktop/SKH/server/data/kopargaon_smart_city_dataset.csv')
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8').trim();
    const newRecordsToAdd = ward4Records.filter(r => {
      const q = r.split(',')[1].replace(/"/g, '');
      return !content.includes(q);
    });

    if (newRecordsToAdd.length > 0) {
      content += '\n' + newRecordsToAdd.join('\n');
      fs.writeFileSync(p, content, 'utf8');
      console.log(`✅ Added ${newRecordsToAdd.length} Ward 4 records to ${p}`);
    } else {
      console.log(`ℹ️ Ward 4 records already exist in ${p}`);
    }
  }
});
