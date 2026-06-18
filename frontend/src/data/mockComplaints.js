export const MOCK_DATA_REFRESHED_AT = "2026-06-16T15:08:23.153Z";

const issueMeta = {
  pothole: {
    issue_type: "Pothole",
    department: "Public Works Department",
    detected_issues: ["pothole", "broken asphalt", "traffic hazard"],
    detection_label: "road_surface_pothole",
  },
  sanitation: {
    issue_type: "Garbage/Sanitation",
    department: "Municipal Sanitation Department",
    detected_issues: ["garbage overflow", "solid waste accumulation", "public health risk"],
    detection_label: "overflowing_waste_point",
  },
  water: {
    issue_type: "Water Leakage",
    department: "Delhi Jal Board",
    detected_issues: ["water leakage", "standing water", "pipe damage"],
    detection_label: "pipe_leakage",
  },
  electrical: {
    issue_type: "Streetlight/Electrical",
    department: "Electricity Department",
    detected_issues: ["streetlight outage", "electrical safety issue", "low visibility"],
    detection_label: "streetlight_outage",
  },
};

const severityScores = [
  ...Array.from({ length: 16 }, (_, index) => [8, 9, 10, 8][index % 4]),
  ...Array.from({ length: 32 }, (_, index) => [5, 6, 7, 6][index % 4]),
  ...Array.from({ length: 32 }, (_, index) => [1, 2, 3, 4][index % 4]),
].map((_, index, scores) => scores[(index * 17) % scores.length]);

const statusSequence = buildStatusSequence();

const complaintSeeds = [
  ...[
    {
      category: "pothole",
      location_name: "Chandni Chowk Road near Red Fort Metro Gate 2",
      latitude: 28.65623,
      longitude: 77.23791,
      description: "There is a deep pothole just after Red Fort Metro Gate 2 on Chandni Chowk Road. Rickshaws and scooters are suddenly cutting to the right, and it becomes worse after even light rain.",
    },
    {
      category: "pothole",
      location_name: "Nai Sarak junction, Chandni Chowk",
      latitude: 28.65531,
      longitude: 77.22984,
      description: "A pothole has opened near the Nai Sarak turn where school vans and e-rickshaws stop. People are putting bricks around it, but traffic is still hitting the edge.",
    },
    {
      category: "pothole",
      location_name: "Town Hall crossing, Chandni Chowk",
      latitude: 28.65701,
      longitude: 77.23068,
      description: "The road surface at Town Hall crossing is broken badly and buses are dipping into the pit. Please repair it before the next market rush because the lane is already very narrow.",
    },
    {
      category: "pothole",
      location_name: "Fatehpuri Masjid approach road, Chandni Chowk",
      latitude: 28.65672,
      longitude: 77.22214,
      description: "There is a wide pothole near the Fatehpuri Masjid approach road. It is filled with dirty water, so pedestrians cannot judge the depth while crossing.",
    },
    {
      category: "pothole",
      location_name: "Kucha Mahajani lane mouth, Chandni Chowk",
      latitude: 28.65591,
      longitude: 77.22873,
      description: "The road at the Kucha Mahajani lane mouth has caved in from one side. Delivery carts are getting stuck there every morning and the shopkeepers have complained several times.",
    },
    {
      category: "pothole",
      location_name: "Dariba Kalan entry, Chandni Chowk",
      latitude: 28.65482,
      longitude: 77.23192,
      description: "A pothole at Dariba Kalan entry is creating a dangerous bump for two-wheelers. It is right before the jewellery market lane, so many senior citizens are also walking around it.",
    },
    {
      category: "pothole",
      location_name: "Paranthe Wali Gali corner, Chandni Chowk",
      latitude: 28.6561,
      longitude: 77.23011,
      description: "The corner near Paranthe Wali Gali has a broken patch that has become a pothole. Tourists and shoppers are stepping into it because the area is crowded and visibility is poor.",
    },
    {
      category: "pothole",
      location_name: "Bhagirath Palace signal, Chandni Chowk",
      latitude: 28.65792,
      longitude: 77.23441,
      description: "There are two potholes near Bhagirath Palace signal where the road meets the market lane. The bigger one is damaging auto-rickshaw tyres and causing small traffic jams.",
    },
    {
      category: "pothole",
      location_name: "Lal Kuan Road turn, Chandni Chowk",
      latitude: 28.65093,
      longitude: 77.22687,
      description: "The Lal Kuan Road turn has a pothole exactly where vehicles slow down. It is becoming unsafe at night because riders brake suddenly and there is no warning sign.",
    },
    {
      category: "pothole",
      location_name: "Church Mission Road, Chandni Chowk",
      latitude: 28.65943,
      longitude: 77.22569,
      description: "A pothole on Church Mission Road is now almost across half the lane. Local residents have placed a plastic crate near it, but that is also creating obstruction.",
    },
    {
      category: "pothole",
      location_name: "Ajmal Khan Road near Karol Bagh Metro Gate 3",
      latitude: 28.64491,
      longitude: 77.18877,
      description: "A large pothole has formed near Karol Bagh Metro Gate 3 on Ajmal Khan Road. The market is busy and pedestrians are forced to step onto the carriageway to avoid it.",
    },
    {
      category: "pothole",
      location_name: "Gaffar Market main lane, Karol Bagh",
      latitude: 28.65021,
      longitude: 77.19124,
      description: "The main lane outside Gaffar Market has a pothole with loose gravel around it. Scooters skid there daily, especially when shop shutters are open and the crowd spills onto the road.",
    },
    {
      category: "pothole",
      location_name: "Bank Street crossing, Karol Bagh",
      latitude: 28.64877,
      longitude: 77.19003,
      description: "Bank Street crossing has a deep broken patch near the zebra crossing. It is creating a jerk for cars and making it difficult for older people to cross safely.",
    },
    {
      category: "pothole",
      location_name: "Pusa Road service lane near Hanuman Mandir",
      latitude: 28.64084,
      longitude: 77.18762,
      description: "The service lane on Pusa Road near Hanuman Mandir has a water-filled pothole. Office traffic hits it at speed in the morning, and splashes are falling on pedestrians.",
    },
    {
      category: "pothole",
      location_name: "Arya Samaj Road, Karol Bagh",
      latitude: 28.64642,
      longitude: 77.19436,
      description: "A pothole on Arya Samaj Road is right beside the bus stop. People waiting for buses have to stand in the road because the edge is broken and uneven.",
    },
    {
      category: "pothole",
      location_name: "DB Gupta Road near Faiz Road signal",
      latitude: 28.65316,
      longitude: 77.19831,
      description: "DB Gupta Road near Faiz Road signal has a long pothole along the left lane. Buses are swerving out suddenly, which is risky for cyclists and two-wheelers.",
    },
    {
      category: "pothole",
      location_name: "Beadonpura market road, Karol Bagh",
      latitude: 28.64932,
      longitude: 77.18755,
      description: "The Beadonpura market road has multiple small potholes becoming one large broken section. Shop deliveries are getting delayed because tempo drivers avoid this stretch.",
    },
    {
      category: "pothole",
      location_name: "Tank Road garment market, Karol Bagh",
      latitude: 28.65248,
      longitude: 77.18644,
      description: "A pothole near Tank Road garment market is collecting rainwater and garbage. It smells bad and creates a sudden dip for e-rickshaws carrying customers.",
    },
    {
      category: "pothole",
      location_name: "Liberty Cinema roundabout, Karol Bagh",
      latitude: 28.65116,
      longitude: 77.19679,
      description: "The road surface near Liberty Cinema roundabout is broken with a pothole on the turning radius. Cars slow down abruptly and it is creating honking and congestion.",
    },
    {
      category: "pothole",
      location_name: "Padam Singh Road, Karol Bagh",
      latitude: 28.64689,
      longitude: 77.19118,
      description: "Padam Singh Road has a pothole just before the parking entrance. The area is crowded with shoppers, and the broken road is making the lane unsafe for walking.",
    },
    {
      category: "pothole",
      location_name: "Rajiv Chowk outer circle near Block A, Connaught Place",
      latitude: 28.63281,
      longitude: 77.21974,
      description: "There is a pothole on the outer circle near Block A at Connaught Place. Cars turning toward Baba Kharak Singh Marg are braking sharply because the pit is not visible from distance.",
    },
    {
      category: "pothole",
      location_name: "Janpath Road near Palika Bazaar Gate 4",
      latitude: 28.62944,
      longitude: 77.21918,
      description: "The road near Palika Bazaar Gate 4 has a pothole that is growing every week. Many pedestrians cross here for the metro, and vehicles splash muddy water on them.",
    },
    {
      category: "pothole",
      location_name: "Barakhamba Road crossing, Connaught Place",
      latitude: 28.6307,
      longitude: 77.22388,
      description: "A deep pothole has appeared near Barakhamba Road crossing. During office hours, two-wheelers are forced into the bus lane to avoid it.",
    },
    {
      category: "pothole",
      location_name: "Kasturba Gandhi Marg near Hindustan Times House",
      latitude: 28.62785,
      longitude: 77.22416,
      description: "The road patch near Hindustan Times House on KG Marg has broken open. It is causing a loud impact for cars and should be filled before the damage spreads.",
    },
    {
      category: "pothole",
      location_name: "Baba Kharak Singh Marg near Hanuman Mandir",
      latitude: 28.63358,
      longitude: 77.21371,
      description: "A pothole near Hanuman Mandir on Baba Kharak Singh Marg is creating a queue during evening traffic. The spot is also used by pedestrians going toward Shivaji Stadium.",
    },
    {
      category: "pothole",
      location_name: "Minto Road underpass approach, Connaught Place",
      latitude: 28.6371,
      longitude: 77.22342,
      description: "The approach to Minto Road underpass has a broken pothole patch. Water collects there quickly, and drivers cannot see the edge after sunset.",
    },
    {
      category: "pothole",
      location_name: "Tolstoy Marg near Statesman House",
      latitude: 28.6289,
      longitude: 77.22258,
      description: "Tolstoy Marg near Statesman House has a pothole in the lane used by buses. It is shaking passengers badly and could damage the road further if not repaired.",
    },
    {
      category: "pothole",
      location_name: "Parliament Street near Jantar Mantar Road",
      latitude: 28.62672,
      longitude: 77.21637,
      description: "A pothole has formed near the Jantar Mantar Road turn on Parliament Street. The area has heavy official traffic, so the road should be repaired urgently.",
    },
    {
      category: "pothole",
      location_name: "Sansad Marg near Patel Chowk Metro",
      latitude: 28.62283,
      longitude: 77.21291,
      description: "Sansad Marg near Patel Chowk Metro has an uneven pothole at the bus bay. People boarding buses are stepping down into broken asphalt and loose stones.",
    },
    {
      category: "pothole",
      location_name: "Connaught Circus inner circle near Block N",
      latitude: 28.63199,
      longitude: 77.21607,
      description: "The inner circle near Block N has a pothole close to the parking exit. It is small but sharp, and several cars are scraping their tyres while turning.",
    },
  ],
  ...[
    {
      category: "sanitation",
      location_name: "Rohini Sector 7 market near M2K Cinema",
      latitude: 28.70794,
      longitude: 77.11706,
      description: "Garbage bins near M2K Cinema in Rohini Sector 7 have been overflowing since yesterday night. Stray dogs are spreading the waste and the smell is reaching the food stalls.",
    },
    {
      category: "sanitation",
      location_name: "Rohini West Metro Station service road",
      latitude: 28.71491,
      longitude: 77.11451,
      description: "Waste is piled up on the service road outside Rohini West Metro Station. Commuters are walking on the main road because the footpath is blocked.",
    },
    {
      category: "sanitation",
      location_name: "Rohini Sector 11 DDA Market",
      latitude: 28.73453,
      longitude: 77.11296,
      description: "The DDA Market in Rohini Sector 11 has a garbage point that has not been cleared for two days. The shopkeepers have covered it with cardboard, but flies are everywhere.",
    },
    {
      category: "sanitation",
      location_name: "Rithala Road near Adventure Island, Rohini",
      latitude: 28.72325,
      longitude: 77.11372,
      description: "A heap of mixed waste is lying on Rithala Road near Adventure Island. Families pass this stretch in the evening, and the smell is very bad.",
    },
    {
      category: "sanitation",
      location_name: "Rohini Sector 3 near Jaipur Golden Hospital",
      latitude: 28.70452,
      longitude: 77.10418,
      description: "Garbage is dumped near Jaipur Golden Hospital side lane in Rohini Sector 3. This is close to a hospital, so it should be cleared on priority.",
    },
    {
      category: "sanitation",
      location_name: "Rohini Sector 16 central park gate",
      latitude: 28.73714,
      longitude: 77.12882,
      description: "The waste collection point near the Sector 16 central park gate is overflowing. Children come to the park in the morning, and the area is not hygienic.",
    },
    {
      category: "sanitation",
      location_name: "Rohini Sector 24 main market",
      latitude: 28.72983,
      longitude: 77.07641,
      description: "There is a large garbage pile in Rohini Sector 24 main market near the vegetable vendors. It blocks one side of the lane and attracts flies throughout the day.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 6 market near DDA Sports Complex",
      latitude: 28.59294,
      longitude: 77.07041,
      description: "The dustbins near Dwarka Sector 6 market are full and waste is spilling onto the pavement. Morning walkers from the sports complex have to cross from the road side.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 10 Metro Station exit road",
      latitude: 28.58168,
      longitude: 77.05728,
      description: "Garbage bags have been left near Dwarka Sector 10 Metro exit road. The spot is right beside the auto stand, and passengers are complaining about the smell.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 12 City Centre",
      latitude: 28.59212,
      longitude: 77.04043,
      description: "The waste point behind Dwarka Sector 12 City Centre is overflowing. Some bags have torn open and plastic is spreading into the parking area.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 4 market, Ashirwad Chowk",
      latitude: 28.60434,
      longitude: 77.04987,
      description: "Garbage has collected near Ashirwad Chowk market in Dwarka Sector 4. It has not been lifted since Sunday and the smell is entering nearby shops.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Mor Metro feeder bus stop",
      latitude: 28.61952,
      longitude: 77.03318,
      description: "The feeder bus stop near Dwarka Mor Metro has a pile of household waste beside it. People are waiting on the road because the bus shelter area is dirty.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 21 near Pacific D21 Mall",
      latitude: 28.55276,
      longitude: 77.05892,
      description: "Waste is dumped near the service lane by Pacific D21 Mall in Sector 21. It is a busy stretch and the garbage is visible from the main road.",
    },
    {
      category: "sanitation",
      location_name: "Dwarka Sector 8 near Bagdola village road",
      latitude: 28.57242,
      longitude: 77.06955,
      description: "Garbage and construction debris are lying near Bagdola village road in Dwarka Sector 8. The drain opening is getting blocked and water may collect there.",
    },
    {
      category: "sanitation",
      location_name: "Uttam Nagar East Metro Station Gate 1",
      latitude: 28.62494,
      longitude: 77.0657,
      description: "Garbage is overflowing near Uttam Nagar East Metro Gate 1. The footpath is already narrow, and commuters are forced to walk between autos.",
    },
    {
      category: "sanitation",
      location_name: "Uttam Nagar Terminal bus stand",
      latitude: 28.62189,
      longitude: 77.05541,
      description: "The bus stand at Uttam Nagar Terminal has waste piled behind the shelter. It smells very bad in the afternoon and passengers cannot sit there.",
    },
    {
      category: "sanitation",
      location_name: "Arya Samaj Road, Uttam Nagar",
      latitude: 28.61783,
      longitude: 77.06061,
      description: "There is a sanitation issue on Arya Samaj Road where garbage is dumped beside the transformer. Local residents have requested cleaning, but no vehicle has come yet.",
    },
    {
      category: "sanitation",
      location_name: "Mohan Garden main road, Uttam Nagar",
      latitude: 28.61265,
      longitude: 77.03574,
      description: "A pile of plastic and food waste is lying on Mohan Garden main road. The waste is blocking the side drain and the lane gets messy when it rains.",
    },
    {
      category: "sanitation",
      location_name: "Nawada Metro Station back lane",
      latitude: 28.62013,
      longitude: 77.04429,
      description: "The back lane near Nawada Metro Station has uncollected garbage bags. Dogs are tearing them open at night and spreading waste in front of houses.",
    },
    {
      category: "sanitation",
      location_name: "Matiala Road near Uttam Nagar police booth",
      latitude: 28.61144,
      longitude: 77.05278,
      description: "Garbage has been dumped near the police booth on Matiala Road. It is creating a bad impression and blocking the corner used by pedestrians.",
    },
    {
      category: "sanitation",
      location_name: "Bindapur DDA flats, Uttam Nagar",
      latitude: 28.60921,
      longitude: 77.06309,
      description: "The garbage collection point near Bindapur DDA flats is overflowing. Residents say the vehicle missed two rounds and the smell has reached the staircases.",
    },
    {
      category: "sanitation",
      location_name: "Janakpuri West approach road near Uttam Nagar",
      latitude: 28.62907,
      longitude: 77.07756,
      description: "There is mixed waste on the approach road between Janakpuri West and Uttam Nagar. It is lying near the divider and creating a safety issue for sweepers.",
    },
  ],
  ...[
    {
      category: "water",
      location_name: "Saket PVR Anupam complex service lane",
      latitude: 28.52455,
      longitude: 77.20692,
      description: "Water has been leaking continuously in the service lane near PVR Anupam, Saket. The road is slippery and two people almost fell while walking toward the market.",
    },
    {
      category: "water",
      location_name: "Saket District Centre near Select Citywalk signal",
      latitude: 28.52881,
      longitude: 77.21966,
      description: "There is a water leakage near the Select Citywalk signal at Saket District Centre. It has formed a stream along the curb and vehicles are splashing pedestrians.",
    },
    {
      category: "water",
      location_name: "Saket Metro Station Gate 2",
      latitude: 28.52091,
      longitude: 77.20129,
      description: "A pipeline seems to be leaking outside Saket Metro Gate 2. Water is collecting around the entry path and people are stepping into mud.",
    },
    {
      category: "water",
      location_name: "Press Enclave Road near Max Hospital, Saket",
      latitude: 28.52746,
      longitude: 77.21354,
      description: "Clean water is flowing on Press Enclave Road near Max Hospital. Since this is close to a hospital and bus stop, please repair the leak urgently.",
    },
    {
      category: "water",
      location_name: "Malviya Nagar Main Market near HDFC Bank",
      latitude: 28.53696,
      longitude: 77.21031,
      description: "Water is leaking from the side of the road near HDFC Bank in Malviya Nagar Main Market. It has been running since morning and the shop entrance area is slippery.",
    },
    {
      category: "water",
      location_name: "Malviya Nagar Metro Station Gate 3",
      latitude: 28.52972,
      longitude: 77.20545,
      description: "There is a continuous water leakage near Malviya Nagar Metro Gate 3. Auto drivers are parking around it, so commuters are walking through the wet patch.",
    },
    {
      category: "water",
      location_name: "Geetanjali Enclave road, Malviya Nagar",
      latitude: 28.53511,
      longitude: 77.21694,
      description: "The road near Geetanjali Enclave has standing water from a leaking pipe. Residents are worried it may weaken the road surface if ignored.",
    },
    {
      category: "water",
      location_name: "Shivalik Road near Aurobindo College",
      latitude: 28.53283,
      longitude: 77.20586,
      description: "Water is leaking on Shivalik Road near Aurobindo College. Students are crossing through the water because the footpath side is blocked by parked bikes.",
    },
    {
      category: "water",
      location_name: "Hauz Khas Village entry road",
      latitude: 28.55416,
      longitude: 77.19487,
      description: "A water line is leaking near the Hauz Khas Village entry road. The lane is already narrow, and the wet surface is making it unsafe for visitors and delivery riders.",
    },
    {
      category: "water",
      location_name: "Aurobindo Marg near IIT Delhi flyover",
      latitude: 28.54891,
      longitude: 77.20033,
      description: "There is water leakage on Aurobindo Marg near the IIT Delhi flyover side. The water is flowing into the left lane and slowing down traffic.",
    },
    {
      category: "water",
      location_name: "Green Park Extension near Hauz Khas",
      latitude: 28.55872,
      longitude: 77.20511,
      description: "Water has been leaking near Green Park Extension close to Hauz Khas. The patch has become muddy and residents are placing stones to cross it.",
    },
    {
      category: "water",
      location_name: "Hauz Khas Metro Station Gate 1",
      latitude: 28.54367,
      longitude: 77.20624,
      description: "A pipe leak outside Hauz Khas Metro Gate 1 is wasting water continuously. The area is crowded during office hours and people are slipping near the staircase.",
    },
    {
      category: "water",
      location_name: "Khirki Extension near Malviya Nagar",
      latitude: 28.53152,
      longitude: 77.2191,
      description: "Water is leaking in Khirki Extension near the main lane toward Malviya Nagar. The water is entering the drain with garbage, creating smell and mosquitoes.",
    },
    {
      category: "water",
      location_name: "Saidulajab near Saket Metro approach",
      latitude: 28.51724,
      longitude: 77.19891,
      description: "There is a leakage near Saidulajab on the approach toward Saket Metro. It has been there for two days and the broken patch is widening.",
    },
    {
      category: "water",
      location_name: "Adchini traffic light, South Delhi",
      latitude: 28.53956,
      longitude: 77.19672,
      description: "Water is flowing near the Adchini traffic light and entering the bus stop area. Pedestrians are avoiding the footpath and walking near moving traffic.",
    },
    {
      category: "water",
      location_name: "Begumpur road near Malviya Nagar park",
      latitude: 28.53992,
      longitude: 77.21318,
      description: "A leakage on Begumpur road near the Malviya Nagar park has made the corner slippery. Children use this route for tuition classes in the evening.",
    },
  ],
  ...[
    {
      category: "electrical",
      location_name: "Preet Vihar Metro Station Gate 2",
      latitude: 28.64185,
      longitude: 77.29564,
      description: "Two streetlights outside Preet Vihar Metro Gate 2 are not working. The area becomes dark after 8 pm and office commuters feel unsafe.",
    },
    {
      category: "electrical",
      location_name: "Preet Vihar C Block market",
      latitude: 28.63781,
      longitude: 77.29239,
      description: "The streetlight in C Block market at Preet Vihar has been flickering for three nights. Shopkeepers are closing early because the lane looks unsafe.",
    },
    {
      category: "electrical",
      location_name: "Vikas Marg near Preet Vihar petrol pump",
      latitude: 28.63902,
      longitude: 77.28974,
      description: "A streetlight pole on Vikas Marg near the Preet Vihar petrol pump is completely off. The divider side is dark and vehicles are taking turns without visibility.",
    },
    {
      category: "electrical",
      location_name: "Mayur Vihar Phase 1 Metro Station service lane",
      latitude: 28.60404,
      longitude: 77.28943,
      description: "The service lane near Mayur Vihar Phase 1 Metro Station has three non-working streetlights. People returning from the metro are using mobile torches.",
    },
    {
      category: "electrical",
      location_name: "Mayur Vihar Pocket 1 market",
      latitude: 28.60972,
      longitude: 77.30381,
      description: "A streetlight in Pocket 1 market is hanging loose and not switching on. It is near the vegetable vendors and should be checked before it falls.",
    },
    {
      category: "electrical",
      location_name: "Mayur Vihar Phase 3 near Ahlcon Public School",
      latitude: 28.61291,
      longitude: 77.33328,
      description: "Streetlights near Ahlcon Public School in Mayur Vihar Phase 3 are dark for almost half the stretch. Parents and students use this road early morning.",
    },
    {
      category: "electrical",
      location_name: "Laxmi Nagar Metro Station Gate 4",
      latitude: 28.63072,
      longitude: 77.27749,
      description: "The streetlight outside Laxmi Nagar Metro Gate 4 is not working. The auto stand gets crowded there, and the dark patch is causing concern for women commuters.",
    },
    {
      category: "electrical",
      location_name: "Laxmi Nagar main market near Vijay Chowk",
      latitude: 28.63237,
      longitude: 77.27986,
      description: "An electrical junction box near Vijay Chowk in Laxmi Nagar market is open. Wires are visible and children pass very close to it after school.",
    },
    {
      category: "electrical",
      location_name: "Nirman Vihar Metro Station approach road",
      latitude: 28.63709,
      longitude: 77.28688,
      description: "The approach road toward Nirman Vihar Metro has a row of streetlights that are not functioning. The stretch is dark and two-wheelers are riding with high beams.",
    },
    {
      category: "electrical",
      location_name: "Shakarpur School Block near Laxmi Nagar",
      latitude: 28.63118,
      longitude: 77.28446,
      description: "Streetlights in Shakarpur School Block have been off since last night. Residents are worried because the lane has many parked vehicles and low visibility.",
    },
    {
      category: "electrical",
      location_name: "Pandav Nagar near Mother Dairy booth",
      latitude: 28.62143,
      longitude: 77.29139,
      description: "The streetlight near the Mother Dairy booth in Pandav Nagar is flickering and sparking sometimes. Please send an electrician because it may become dangerous in rain.",
    },
    {
      category: "electrical",
      location_name: "Preet Vihar District Centre parking lane",
      latitude: 28.63639,
      longitude: 77.29486,
      description: "The parking lane at Preet Vihar District Centre has poor lighting because two poles are dead. People are parking in the dark and minor scratches are happening.",
    },
  ],
].map((seed, index) => ({
  ...seed,
  hours_ago: Number(((index * 37 + 5) % 168 + (index % 4) * 0.35).toFixed(2)),
}));

function buildStatusSequence() {
  const caps = { Pending: 30, "In Progress": 25, Resolved: 25 };
  const counts = { Pending: 0, "In Progress": 0, Resolved: 0 };
  const pattern = ["Pending", "In Progress", "Resolved", "Pending", "In Progress", "Resolved", "Pending"];

  return Array.from({ length: 80 }, (_, index) => {
    const preferred = pattern[(index * 5) % pattern.length];
    const fallback = Object.keys(caps).find((status) => counts[status] < caps[status]);
    const selected = counts[preferred] < caps[preferred] ? preferred : fallback;
    counts[selected] += 1;
    return selected;
  });
}

function urgencyFromSeverity(severityScore) {
  if (severityScore >= 8) return "HIGH";
  if (severityScore >= 5) return "MEDIUM";
  return "LOW";
}

function severityLabel(score) {
  if (score >= 8) return "critical";
  if (score >= 5) return "medium";
  return "low";
}

function relativeTimestamp(hoursAgo) {
  return new Date(new Date(MOCK_DATA_REFRESHED_AT).getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function priorityScore(severityScore, urgency, hoursAgo) {
  const urgencyScore = { HIGH: 22, MEDIUM: 12, LOW: 4 }[urgency];
  const ageScore = Math.min(20, Math.round((hoursAgo / 168) * 20));
  return Math.min(100, Math.round(severityScore * 6.2 + urgencyScore + ageScore));
}

function formattedDelhiTime(isoTimestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date(isoTimestamp));
}

function formalComplaintFor(seed, meta, severityScore) {
  return `I request the concerned ${meta.department} to inspect and resolve the reported ${meta.issue_type.toLowerCase()} at ${seed.location_name}. The issue has been observed by residents and commuters and is creating inconvenience and safety risk in the area. Kindly arrange field verification and corrective action at the earliest, as the current severity has been assessed at ${severityScore}/10 by Civic Copilot.`;
}

function buildAiAnalysis(seed, meta, severityScore, urgency, submittedAt) {
  return {
    issue_type: meta.issue_type,
    location: seed.location_name,
    urgency,
    department: meta.department,
    formal_complaint: formalComplaintFor(seed, meta, severityScore),
    confidence_score: Number((0.82 + (severityScore % 5) * 0.025).toFixed(2)),
    detected_issues: meta.detected_issues,
    severity_score: severityScore,
    confidence: Number((0.8 + (severityScore % 4) * 0.03).toFixed(2)),
    detection_label: meta.detection_label,
    analyzed_at: submittedAt,
  };
}

export const mockComplaints = complaintSeeds.map((seed, index) => {
  const ticketNumber = 2801 + index;
  const severity_score = severityScores[index];
  const urgency = urgencyFromSeverity(severity_score);
  const submitted_at = relativeTimestamp(seed.hours_ago);
  const meta = issueMeta[seed.category];
  const formal_complaint = formalComplaintFor(seed, meta, severity_score);
  const score = priorityScore(severity_score, urgency, seed.hours_ago);

  return {
    id: `complaint-${ticketNumber}`,
    ticket_id: `CCP-${ticketNumber}`,
    ticket: `CCP-${ticketNumber}`,
    issue_type: meta.issue_type,
    issue: meta.issue_type,
    type: seed.category === "pothole" ? "roads" : seed.category,
    description: seed.description,
    location_name: seed.location_name,
    location: seed.location_name,
    area: seed.location_name.split(",").at(-1)?.trim() ?? seed.location_name,
    latitude: seed.latitude,
    longitude: seed.longitude,
    urgency,
    severity: severityLabel(severity_score),
    severity_score,
    department: meta.department,
    assigned_department: meta.department,
    status: statusSequence[index],
    submitted_at,
    submitted: formattedDelhiTime(submitted_at),
    ai_analysis: buildAiAnalysis(seed, meta, severity_score, urgency, submitted_at),
    formal_complaint,
    priority_score: score,
    priorityScore: score,
    photo_url: "/issues/delhi-pothole-evidence.png",
    photo: "/issues/delhi-pothole-evidence.png",
  };
});

export const mockComplaintSummary = {
  total: mockComplaints.length,
  by_issue: {
    pothole: mockComplaints.filter((complaint) => complaint.issue_type === "Pothole").length,
    sanitation: mockComplaints.filter((complaint) => complaint.issue_type === "Garbage/Sanitation").length,
    water: mockComplaints.filter((complaint) => complaint.issue_type === "Water Leakage").length,
    electrical: mockComplaints.filter((complaint) => complaint.issue_type === "Streetlight/Electrical").length,
  },
  by_status: {
    Pending: mockComplaints.filter((complaint) => complaint.status === "Pending").length,
    "In Progress": mockComplaints.filter((complaint) => complaint.status === "In Progress").length,
    Resolved: mockComplaints.filter((complaint) => complaint.status === "Resolved").length,
  },
  by_severity: {
    critical: mockComplaints.filter((complaint) => complaint.severity_score >= 8).length,
    medium: mockComplaints.filter((complaint) => complaint.severity_score >= 5 && complaint.severity_score <= 7).length,
    low: mockComplaints.filter((complaint) => complaint.severity_score <= 4).length,
  },
};
