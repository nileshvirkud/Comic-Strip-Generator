#!/usr/bin/env node

/**
 * Script to check database records for jobs and comics
 */

const { PrismaClient } = require('@prisma/client');

async function checkJobs() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:comicspassword@localhost:5432/comic_strip_generator_dev'
      }
    }
  });

  try {
    console.log('🔍 Checking database records...\n');
    
    // Check recent comics
    console.log('📖 Recent comics:');
    const comics = await prisma.comics.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        template: true,
        panels: true,
      }
    });
    
    comics.forEach((comic, index) => {
      console.log(`   ${index + 1}. ${comic.title} (${comic.status})`);
      console.log(`      ID: ${comic.id}`);
      console.log(`      Created: ${comic.createdAt}`);
      console.log(`      Template: ${comic.template?.name}`);
      console.log(`      Panels: ${comic.panels?.length || 0}`);
      console.log('');
    });
    
    // Check generation jobs
    console.log('⚙️ Generation jobs:');
    const jobs = await prisma.generationJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    if (jobs.length === 0) {
      console.log('   No generation jobs found');
    } else {
      jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. Job ${job.id} (${job.jobType})`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Progress: ${job.progress}%`);
        console.log(`      Comic ID: ${job.comicId}`);
        console.log(`      Created: ${job.createdAt}`);
        if (job.error) {
          console.log(`      Error: ${job.error}`);
        }
        console.log('');
      });
    }
    
    // Check queue statistics using Redis
    console.log('📊 Queue statistics:');
    console.log('   (Note: This would require Redis connection to check queue stats)');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJobs();