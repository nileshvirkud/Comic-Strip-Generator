import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: '2x2 Grid',
    layoutConfig: {
      rows: 2,
      columns: 2,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 50, height: 50 } },
        { id: '2', position: { x: 50, y: 0, width: 50, height: 50 } },
        { id: '3', position: { x: 0, y: 50, width: 50, height: 50 } },
        { id: '4', position: { x: 50, y: 50, width: 50, height: 50 } },
      ],
    },
    thumbnailUrl: '/templates/2x2-grid.png',
    panelCount: 4,
  },
  {
    name: '3x1 Horizontal',
    layoutConfig: {
      rows: 1,
      columns: 3,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 33.33, height: 100 } },
        { id: '2', position: { x: 33.33, y: 0, width: 33.33, height: 100 } },
        { id: '3', position: { x: 66.66, y: 0, width: 33.33, height: 100 } },
      ],
    },
    thumbnailUrl: '/templates/3x1-horizontal.png',
    panelCount: 3,
  },
  {
    name: '4x1 Strip',
    layoutConfig: {
      rows: 1,
      columns: 4,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 25, height: 100 } },
        { id: '2', position: { x: 25, y: 0, width: 25, height: 100 } },
        { id: '3', position: { x: 50, y: 0, width: 25, height: 100 } },
        { id: '4', position: { x: 75, y: 0, width: 25, height: 100 } },
      ],
    },
    thumbnailUrl: '/templates/4x1-strip.png',
    panelCount: 4,
  },
  {
    name: '1x3 Vertical',
    layoutConfig: {
      rows: 3,
      columns: 1,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 100, height: 33.33 } },
        { id: '2', position: { x: 0, y: 33.33, width: 100, height: 33.33 } },
        { id: '3', position: { x: 0, y: 66.66, width: 100, height: 33.33 } },
      ],
    },
    thumbnailUrl: '/templates/1x3-vertical.png',
    panelCount: 3,
  },
  {
    name: 'Hero Panel',
    layoutConfig: {
      rows: 2,
      columns: 2,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 100, height: 70 } },
        { id: '2', position: { x: 0, y: 70, width: 50, height: 30 } },
        { id: '3', position: { x: 50, y: 70, width: 50, height: 30 } },
      ],
    },
    thumbnailUrl: '/templates/hero-panel.png',
    panelCount: 3,
  },
  {
    name: 'Action Sequence',
    layoutConfig: {
      rows: 2,
      columns: 3,
      panels: [
        { id: '1', position: { x: 0, y: 0, width: 40, height: 50 } },
        { id: '2', position: { x: 40, y: 0, width: 30, height: 50 } },
        { id: '3', position: { x: 70, y: 0, width: 30, height: 50 } },
        { id: '4', position: { x: 0, y: 50, width: 33.33, height: 50 } },
        { id: '5', position: { x: 33.33, y: 50, width: 33.33, height: 50 } },
        { id: '6', position: { x: 66.66, y: 50, width: 33.33, height: 50 } },
      ],
    },
    thumbnailUrl: '/templates/action-sequence.png',
    panelCount: 6,
  },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing templates
  await prisma.template.deleteMany();

  // Seed templates
  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });