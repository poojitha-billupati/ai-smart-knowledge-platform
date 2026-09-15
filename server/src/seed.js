import 'dotenv/config';
import mongoose from 'mongoose';
import { access } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Information from './models/Information.js';
import Event from './models/Event.js';
import Image from './models/Image.js';
import Faq from './models/Faq.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '..', 'public', 'images');

async function assertImageExists(file) {
  try {
    await access(path.join(imagesDir, file));
  } catch {
    throw new Error(
      `${file} not found in server/public/images — run "npm run generate:images" first`,
    );
  }
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
    imageFile: 'ai-ml-workshop.webp',
  },
  {
    title: 'Annual Tech Fest — Innovate',
    date: new Date('2026-11-05T09:00:00.000Z'),
    location: 'Campus Grounds',
    description:
      'Three-day tech fest with hackathons, robotics demos, and guest talks from industry speakers.',
    imageFile: 'innovate-tech-fest.webp',
  },
  {
    title: 'Career Fair',
    date: new Date('2026-12-02T09:30:00.000Z'),
    location: 'Sports Complex',
    description: 'Over 40 companies on campus for internship and placement interviews. Bring printed resumes.',
    imageFile: 'career-fair.webp',
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

  await Promise.all([
    ...events.map((e) => assertImageExists(e.imageFile)),
    assertImageExists('central-library.webp'),
  ]);

  await Information.insertMany(information);
  await Faq.insertMany(faq);

  // Each event carries its own banner directly — no separate Image record.
  // The Images collection is for gallery photos only.
  const createdEvents = await Event.insertMany(
    events.map(({ imageFile, ...rest }) => ({ ...rest, imageUrl: `/images/${imageFile}` })),
  );

  const libraryInfo = await Information.findOne({ title: 'Library Hours' });
  await Image.create({
    title: 'Central Library',
    imageUrl: '/images/central-library.webp',
    category: 'Campus',
    altText: 'Central library reading hall',
    relatedId: libraryInfo._id,
    relatedType: 'information',
  });

  console.log(
    `Seeded ${information.length} information, ${createdEvents.length} events, ${faq.length} faq, 1 image`,
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
