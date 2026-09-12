import { placeholderImage } from './placeholder';

const images = [
  {
    _id: 'img1',
    title: 'AI & ML Workshop',
    imageUrl: placeholderImage('AI & ML Workshop', '#6d28d9'),
    category: 'Events',
    altText: 'Students at the AI and ML workshop',
    relatedId: 'evt1',
    relatedType: 'event',
  },
  {
    _id: 'img2',
    title: 'Innovate Tech Fest',
    imageUrl: placeholderImage('Innovate Tech Fest', '#2563eb'),
    category: 'Events',
    altText: 'Tech fest banner with robotics demo',
    relatedId: 'evt2',
    relatedType: 'event',
  },
  {
    _id: 'img3',
    title: 'Career Fair',
    imageUrl: placeholderImage('Career Fair', '#059669'),
    category: 'Events',
    altText: 'Career fair booths in the sports complex',
    relatedId: 'evt3',
    relatedType: 'event',
  },
  {
    _id: 'img4',
    title: 'Central Library',
    imageUrl: placeholderImage('Central Library', '#b45309'),
    category: 'Campus',
    altText: 'Central library reading hall',
    relatedId: 'info3',
    relatedType: 'information',
  },
];

export default images;
