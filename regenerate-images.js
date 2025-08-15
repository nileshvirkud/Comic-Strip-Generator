#!/usr/bin/env node

/**
 * Script to regenerate images for existing comic panels
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function regenerateImages() {
  try {
    console.log('🎨 Regenerating images for existing comic...');
    
    // Find the comic
    const comic = await prisma.comics.findFirst({
      where: { 
        status: 'COMPLETED',
        title: { contains: 'Test Comic' } // Our test comic
      },
      include: { panels: { orderBy: { panelNumber: 'asc' } } }
    });
    
    if (!comic) {
      console.log('❌ No comic found to regenerate');
      return;
    }
    
    console.log(`📚 Found comic: ${comic.title} (${comic.panels.length} panels)`);
    
    // For demonstration, let's use some real comic-style image URLs
    // In production, this would trigger the actual AI generation
    const comicImageUrls = [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=512&h=288&fit=crop&crop=center', // Space/sci-fi scene
      'https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?w=512&h=288&fit=crop&crop=center', // Forest/botanical scene
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=512&h=288&fit=crop&crop=center', // Cosmic space scene
      'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=512&h=288&fit=crop&crop=center', // Botanical/plant scene
      'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=512&h=288&fit=crop&crop=center', // Adventure scene
      'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=512&h=288&fit=crop&crop=center'  // Mystical forest scene
    ];
    
    // Update each panel with a better image
    for (let i = 0; i < comic.panels.length; i++) {
      const panel = comic.panels[i];
      const imageUrl = comicImageUrls[i] || comicImageUrls[0]; // Fallback to first image
      
      await prisma.panel.update({
        where: { id: panel.id },
        data: { imageUrl }
      });
      
      console.log(`✅ Updated panel ${panel.panelNumber} with new image`);
    }
    
    // Update comic title back to original
    await prisma.comics.update({
      where: { id: comic.id },
      data: { title: 'Starlight Botanica' }
    });
    
    console.log('🚀 Comic images regenerated successfully!');
    console.log(`📍 Comic ID: ${comic.id}`);
    console.log('🌐 You can now view the comic at: http://localhost:3000/comics/' + comic.id);
    
  } catch (error) {
    console.error('❌ Error regenerating images:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateImages();