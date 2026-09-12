import 'dotenv/config';
import mongoose from 'mongoose';
import Information from './models/Information.js';
import Event from './models/Event.js';
import Image from './models/Image.js';
import Faq from './models/Faq.js';

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function placeholderImage(label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
    <rect width="600" height="400" fill="${color}"/>
    <text x="50%" y="50%" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28"
      text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const information = [
  {
    title: 'Admission Process',
    description:
      'Admissions open every June through the online portal. Applicants submit transcripts, an entrance score, and a statement of purpose. Shortlisted candidates are called for counseling in July.',
    category: 'Academics',
    tags: ['admission', 'process', 'counseling'],
  },
  {
    title: 'Fee Structure',
    description:
      'Tuition is billed per semester. Hostel and mess fees are billed separately. A need-based scholarship covers up to 50% of tuition for eligible students.',
    category: 'Finance',
    tags: ['fees', 'scholarship', 'tuition'],
  },
  {
    title: 'Library Hours',
    description:
      'The central library is open 8am-10pm on weekdays and 9am-6pm on weekends. Reference sections require a valid student ID.',
    category: 'Facilities',
    tags: ['library', 'hours', 'facilities'],
  },
  {
    title: 'Hostel Allotment',
    description:
      'Hostel rooms are allotted by seniority and distance from campus. First-year students are guaranteed a seat if they apply before the July deadline.',
    category: 'Facilities',
    tags: ['hostel', 'allotment', 'housing'],
  },
];

const events = [
  {
    title: 'AI & ML Workshop',
    date: new Date('2026-10-14T10:00:00.000Z'),
    location: 'Main Auditorium',
    description:
      'Hands-on workshop covering the basics of machine learning, model training, and deployment. Open to all second-year and above students.',
    color: '#6d28d9',
  },
  {
    title: 'Annual Tech Fest — Innovate',
    date: new Date('2026-11-05T09:00:00.000Z'),
    location: 'Campus Grounds',
    description:
      'Three-day tech fest with hackathons, robotics demos, and guest talks from industry speakers.',
    color: '#2563eb',
  },
  {
    title: 'Career Fair',
    date: new Date('2026-12-02T09:30:00.000Z'),
    location: 'Sports Complex',
    description: 'Over 40 companies on campus for internship and placement interviews. Bring printed resumes.',
    color: '#059669',
  },
];

const faq = [
  {
    question: 'What is the fee structure?',
    answer:
      'Tuition is billed per semester, with hostel and mess fees billed separately. Need-based scholarships cover up to 50% of tuition.',
    category: 'Finance',
    keywords: ['fees', 'scholarship', 'tuition', 'cost'],
  },
  {
    question: 'How do I apply for a hostel room?',
    answer:
      'Apply through the student portal before the July deadline. Rooms are allotted by seniority and distance from campus; first-years are guaranteed a seat if they apply on time.',
    category: 'Facilities',
    keywords: ['hostel', 'housing', 'room', 'allotment'],
  },
  {
    question: 'When does the library open?',
    answer: 'The central library is open 8am-10pm on weekdays and 9am-6pm on weekends.',
    category: 'Facilities',
    keywords: ['library', 'hours', 'timing'],
  },
  {
    question: 'How do I register for the AI & ML Workshop?',
    answer:
      'Registration is open to all second-year and above students through the Events page. Seats are limited and filled on a first-come basis.',
    category: 'Events',
    keywords: ['workshop', 'AI', 'ML', 'registration'],
  },
];

export async function seed() {
  await Promise.all([
    Information.deleteMany({}),
    Event.deleteMany({}),
    Image.deleteMany({}),
    Faq.deleteMany({}),
  ]);

  await Information.insertMany(information);
  await Faq.insertMany(faq);

  const createdEvents = await Event.insertMany(events.map(({ color, ...rest }) => rest));

  const images = await Image.insertMany(
    createdEvents.map((event, i) => ({
      title: event.title,
      imageUrl: placeholderImage(event.title, events[i].color),
      category: 'Events',
      altText: `Banner for ${event.title}`,
      relatedId: event._id,
      relatedType: 'event',
    })),
  );

  await Promise.all(
    createdEvents.map((event, i) =>
      Event.findByIdAndUpdate(event._id, { imageId: images[i]._id }),
    ),
  );

  const libraryInfo = await Information.findOne({ title: 'Library Hours' });
  await Image.create({
    title: 'Central Library',
    imageUrl: placeholderImage('Central Library', '#b45309'),
    category: 'Campus',
    altText: 'Central library reading hall',
    relatedId: libraryInfo._id,
    relatedType: 'information',
  });

  console.log(
    `Seeded ${information.length} information, ${createdEvents.length} events, ${faq.length} faq, ${images.length + 1} images`,
  );
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set — configure server/.env before seeding');
  }
  await mongoose.connect(process.env.MONGO_URI);
  await seed();
  await mongoose.disconnect();
}

const isMainModule = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
