// Labelled evaluation set: 33 complaints written for this project (English and Hinglish).
// Labels were written BEFORE running the evaluation. Some cases are deliberately hard:
// the point is to measure the pipeline honestly, not to score 100%.
// Coordinates are around Phagwara, Punjab. Photos are synthetic (see scripts/make-eval-images.ts).

export interface EvalCase {
  id: string;
  citizen: string;
  /** Minutes after the start of the scenario at which the complaint is submitted. */
  minute: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  image: string;
  expectedCategory: string;
  /** id of the earlier complaint this one duplicates, if any. */
  duplicateOf?: string;
  /** true = a human reviewer should be warned about this submission. */
  suspicious: boolean;
  note?: string;
}

const DAY = 24 * 60;

export const EVAL_CASES: EvalCase[] = [
  // ---- Roads ----
  { id: 'e01', citizen: 'c1', minute: 0, title: 'Deep pothole near bus stand', description: 'There is a large pothole on the main road near the bus stand. Two bikes slipped here yesterday evening.', latitude: 31.2536, longitude: 75.7037, image: 'pothole-1.jpg', expectedCategory: 'ROADS', suspicious: false },
  { id: 'e02', citizen: 'c2', minute: 90, title: 'Big pothole on main road near bus stand', description: 'Large pothole near the bus stand on the main road. Vehicles are getting damaged every day.', latitude: 31.2538, longitude: 75.704, image: 'pothole-2.jpg', expectedCategory: 'ROADS', duplicateOf: 'e01', suspicious: false, note: 'Duplicate, different photo, 35 m away' },
  { id: 'e03', citizen: 'c3', minute: 120, title: 'Sadak par bada gaddha', description: 'Hamare mohalle ki sadak par bahut bada gaddha ho gaya hai, bacche aur buzurg gir rahe hain.', latitude: 31.268, longitude: 75.72, image: 'pothole-3.jpg', expectedCategory: 'ROADS', suspicious: false, note: 'Hinglish' },
  { id: 'e04', citizen: 'c1', minute: 200, title: 'Footpath tiles broken outside market', description: 'The footpath outside the vegetable market is broken and elderly people are tripping on the loose tiles.', latitude: 31.262, longitude: 75.712, image: 'pothole-4.jpg', expectedCategory: 'ROADS', suspicious: false },
  { id: 'e05', citizen: 'c4', minute: 260, title: 'Road caved in after rain', description: 'Part of the street has sunk and a crater has formed after last night\'s rain. It is dangerous for traffic.', latitude: 31.245, longitude: 75.695, image: 'pothole-5.jpg', expectedCategory: 'ROADS', suspicious: false },
  { id: 'e06', citizen: 'c5', minute: 300, title: 'Bikes keep skidding at the turn', description: 'Loose gravel and a broken surface at the turning near the temple. Three scooters have skidded this week.', latitude: 31.239, longitude: 75.711, image: 'pothole-6.jpg', expectedCategory: 'ROADS', suspicious: false, note: 'Hard: no obvious road keyword' },

  // ---- Water supply ----
  { id: 'e07', citizen: 'c2', minute: 330, title: 'No water supply for three days', description: 'There has been no water in our lane since Monday. The tap is completely dry and we are buying tankers.', latitude: 31.249, longitude: 75.709, image: 'leak-2.jpg', expectedCategory: 'WATER_SUPPLY', suspicious: false },
  { id: 'e08', citizen: 'c3', minute: 400, title: 'Pipe burst flooding the lane', description: 'The drinking water pipeline has burst near house 14 and clean water is being wasted since morning.', latitude: 31.258, longitude: 75.7, image: 'leak-1.jpg', expectedCategory: 'WATER_SUPPLY', suspicious: false },
  { id: 'e09', citizen: 'c4', minute: 420, title: 'Nal me ganda pani aa raha hai', description: 'Subah se nal me ganda pani aa raha hai, peene layak bilkul nahi hai. Bacche bimar ho rahe hain.', latitude: 31.271, longitude: 75.703, image: 'leak-3.jpg', expectedCategory: 'WATER_SUPPLY', suspicious: false, note: 'Hinglish' },
  { id: 'e10', citizen: 'c5', minute: 470, title: 'Water pipeline leaking heavily', description: 'The water supply pipe has burst near house 14 and the whole lane is flooded with water.', latitude: 31.2582, longitude: 75.7002, image: 'leak-1-forwarded.jpg', expectedCategory: 'WATER_SUPPLY', duplicateOf: 'e08', suspicious: false, note: 'Duplicate by a neighbour who forwarded the SAME photo: genuine, but will trip the reused-photo signal' },
  { id: 'e11', citizen: 'c1', minute: 520, title: 'Low pressure in taps on second floor', description: 'Water pressure has been very low since last week. The overhead tank does not fill even in two hours.', latitude: 31.266, longitude: 75.699, image: 'leak-4.jpg', expectedCategory: 'WATER_SUPPLY', suspicious: false },

  // ---- Drainage ----
  { id: 'e12', citizen: 'c2', minute: 600, title: 'Drain overflowing on street', description: 'The drain in front of the school is blocked and sewage is overflowing onto the street.', latitude: 31.251, longitude: 75.715, image: 'drain-1.jpg', expectedCategory: 'DRAINAGE', suspicious: false },
  { id: 'e13', citizen: 'c3', minute: 640, title: 'Open manhole near park gate', description: 'The manhole cover is missing near the park gate. It is very dangerous at night, someone will fall in.', latitude: 31.2545, longitude: 75.6975, image: 'drain-3.jpg', expectedCategory: 'DRAINAGE', suspicious: false },
  { id: 'e14', citizen: 'c4', minute: 700, title: 'Nali band hai, pani sadak par', description: 'Nali choke ho gayi hai aur ganda pani sadak par jama ho raha hai. Bahut badbu aa rahi hai.', latitude: 31.24, longitude: 75.705, image: 'drain-4.jpg', expectedCategory: 'DRAINAGE', suspicious: false, note: 'Hard Hinglish: contains water and road words too' },
  { id: 'e15', citizen: 'c5', minute: 760, title: 'Waterlogging after every rain', description: 'Our colony gets waterlogged after every shower. The water stays for days because the gutter is clogged.', latitude: 31.2445, longitude: 75.7185, image: 'drain-5.jpg', expectedCategory: 'DRAINAGE', suspicious: false },
  { id: 'e16', citizen: 'c1', minute: 800, title: 'Sewage overflowing near school', description: 'Blocked drain near the school gate. Dirty sewage water is all over the street and children walk through it.', latitude: 31.2514, longitude: 75.7154, image: 'drain-2.jpg', expectedCategory: 'DRAINAGE', duplicateOf: 'e12', suspicious: false, note: 'Duplicate, different photo, 60 m away' },

  // ---- Sanitation ----
  { id: 'e17', citizen: 'c2', minute: 1 * DAY, title: 'Garbage not collected for a week', description: 'A big garbage pile is lying at the corner. The dustbin is overflowing and the smell is unbearable.', latitude: 31.2605, longitude: 75.7065, image: 'garbage-1.jpg', expectedCategory: 'SANITATION', suspicious: false },
  { id: 'e18', citizen: 'c3', minute: 1 * DAY + 60, title: 'Kachra uthane koi nahi aata', description: 'Gali ke kone par kachre ka dher laga hai. Badbu aur machhar se sab pareshan hain.', latitude: 31.2365, longitude: 75.699, image: 'garbage-3.jpg', expectedCategory: 'SANITATION', suspicious: false, note: 'Hinglish' },
  { id: 'e19', citizen: 'c4', minute: 1 * DAY + 100, title: 'Dead animal on roadside', description: 'A dead animal has been lying on the roadside for two days. The stink is spreading to nearby houses.', latitude: 31.243, longitude: 75.714, image: 'garbage-4.jpg', expectedCategory: 'SANITATION', suspicious: false },
  { id: 'e20', citizen: 'c5', minute: 1 * DAY + 150, title: 'Overflowing dustbin and garbage heap', description: 'The dustbin at the corner is overflowing and garbage has not been collected for a week.', latitude: 31.2606, longitude: 75.7067, image: 'garbage-2.jpg', expectedCategory: 'SANITATION', duplicateOf: 'e17', suspicious: false, note: 'Duplicate, different photo, 25 m away' },
  { id: 'e21', citizen: 'c1', minute: 1 * DAY + 200, title: 'Empty plot being used as a dump', description: 'People throw household waste in the empty Plot 12345 next to our house. Stray dogs spread it around.', latitude: 31.255, longitude: 75.692, image: 'garbage-5.jpg', expectedCategory: 'SANITATION', suspicious: false, note: 'Contains "12345": must NOT count as gibberish' },

  // ---- Streetlights and electricity ----
  { id: 'e22', citizen: 'c2', minute: 1 * DAY + 300, title: 'Streetlight not working', description: 'The streetlight outside house 22 has been off for ten days. The lane is completely dark at night.', latitude: 31.2565, longitude: 75.7095, image: 'streetlight-1.jpg', expectedCategory: 'LIGHTING', suspicious: false },
  { id: 'e23', citizen: 'c3', minute: 1 * DAY + 340, title: 'Bijli ka khamba jhuk gaya hai', description: 'Bijli ka khamba kabhi bhi gir sakta hai, taar neeche latak rahe hain. Bahut khatra hai.', latitude: 31.2325, longitude: 75.7075, image: 'streetlight-2.jpg', expectedCategory: 'LIGHTING', suspicious: false, note: 'Hinglish' },
  { id: 'e24', citizen: 'c4', minute: 1 * DAY + 380, title: 'Sparking from transformer', description: 'Sparks are coming from the transformer near the market. This is an emergency, please send someone.', latitude: 31.264, longitude: 75.704, image: 'streetlight-3.jpg', expectedCategory: 'LIGHTING', suspicious: false },
  { id: 'e25', citizen: 'c2', minute: 3 * DAY + 300, title: 'Street light still not working', description: 'The street light outside house 22 is still off. The lane is dark at night and nobody has come.', latitude: 31.2565, longitude: 75.7095, image: 'streetlight-1-forwarded.jpg', expectedCategory: 'LIGHTING', duplicateOf: 'e22', suspicious: false, note: 'Same citizen reminding with the same photo: a duplicate, not a fake' },
  { id: 'e26', citizen: 'c1', minute: 1 * DAY + 420, title: 'Streetlight flickers all night', description: 'The light near the temple keeps flickering on and off through the night. It disturbs everyone.', latitude: 31.2585, longitude: 75.7115, image: 'streetlight-4.jpg', expectedCategory: 'LIGHTING', suspicious: false, note: 'Near e22 (about 290 m) but a different light: must NOT be a duplicate' },

  // ---- Public property ----
  { id: 'e27', citizen: 'c3', minute: 1 * DAY + 500, title: 'Broken bench in children\'s park', description: 'The bench in the children\'s park is broken and the swings are damaged. Kids are getting hurt.', latitude: 31.2525, longitude: 75.698, image: 'bench-1.jpg', expectedCategory: 'PUBLIC_PROPERTY', suspicious: false },
  { id: 'e28', citizen: 'c4', minute: 1 * DAY + 560, title: 'Bus stop shelter roof damaged', description: 'The roof sheet of the bus stop shelter is hanging loose and may fall on waiting passengers.', latitude: 31.247, longitude: 75.689, image: 'bench-2.jpg', expectedCategory: 'PUBLIC_PROPERTY', suspicious: false },

  // ---- Suspicious submissions ----
  { id: 'e29', citizen: 'c5', minute: 2 * DAY, title: 'Pothole in front of my shop', description: 'Huge pothole in front of my shop on the bypass. Please repair it, customers cannot park.', latitude: 31.275, longitude: 75.69, image: 'pothole-1-forwarded.jpg', expectedCategory: 'ROADS', suspicious: true, note: 'FAKE: reuses the photo of e01 (another citizen) for a place 3 km away' },
  { id: 'e30', citizen: 'c5', minute: 2 * DAY + 2, title: 'Test complaint', description: 'asdf asdf asdf asdf qwerty', latitude: 31.26, longitude: 75.72, image: 'screenshot-1.jpg', expectedCategory: 'OTHER', suspicious: true, note: 'SPAM: filler text and a screenshot' },
  { id: 'e31', citizen: 'c4', minute: 2 * DAY + 60, title: 'Garbage dumped near school', description: 'A lot of garbage has been dumped near the school boundary wall and nobody is cleaning it.', latitude: 31.2475, longitude: 75.7005, image: 'garbage-old-elsewhere.jpg', expectedCategory: 'SANITATION', suspicious: true, note: 'SUSPICIOUS: photo metadata says it was taken 20 months ago in another city' },
  { id: 'e32', citizen: 'c5', minute: 2 * DAY + 120, title: 'Water leakage in my street', description: 'There is heavy water leakage in my street from the main pipe. Please fix it soon.', latitude: 31.2415, longitude: 75.6935, image: 'screenshot-2.jpg', expectedCategory: 'WATER_SUPPLY', suspicious: true, note: 'SUSPICIOUS: the "photo" is a screenshot. Only a vision model can notice' },
  { id: 'e33', citizen: 'c1', minute: 2 * DAY + 200, title: 'Streetlight broken on our road', description: 'The streetlight on our road has been broken for a month and it is not safe to walk at night.', latitude: 31.2475, longitude: 75.7005, image: 'garbage-6.jpg', expectedCategory: 'LIGHTING', suspicious: true, note: 'SUSPICIOUS: the photo shows garbage, not a streetlight. Only a vision model can notice' },
];
