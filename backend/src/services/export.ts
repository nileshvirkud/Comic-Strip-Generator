import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { Comic, Panel, ExportOptions } from '@/types';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export class ExportService {
  private async generateComicHTML(comic: Comic): Promise<string> {
    const panels = comic.panels.sort((a, b) => a.panelNumber - b.panelNumber);
    const template = comic.template;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${comic.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Comic Neue', 'Arial', sans-serif;
            background: white;
            color: black;
        }
        
        .comic-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: white;
            position: relative;
            aspect-ratio: 10/7;
        }
        
        .comic-panel {
            position: absolute;
            border: 4px solid black;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .panel-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .speech-bubble {
            position: absolute;
            background: white;
            border: 2px solid black;
            border-radius: 50%;
            padding: 8px;
            max-width: 40%;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            word-wrap: break-word;
            z-index: 10;
        }
        
        .speech-bubble::after {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 12px solid white;
            bottom: -10px;
            left: 20px;
        }
        
        .speech-bubble::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 14px solid black;
            bottom: -12px;
            left: 18px;
        }
        
        .panel-number {
            position: absolute;
            top: -8px;
            left: -8px;
            width: 24px;
            height: 24px;
            background: black;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            z-index: 20;
        }
        
        .comic-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: black;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .comic-container {
                max-width: none;
                width: 100%;
                height: 100vh;
            }
        }
    </style>
</head>
<body>
    <div class="comic-title">${comic.title}</div>
    <div class="comic-container">
        ${panels.map(panel => `
            <div class="comic-panel" style="
                left: ${panel.position.x}%;
                top: ${panel.position.y}%;
                width: ${panel.position.width}%;
                height: ${panel.position.height}%;
            ">
                <div class="panel-number">${panel.panelNumber}</div>
                ${panel.imageUrl ? `
                    <img src="${panel.imageUrl}" alt="Panel ${panel.panelNumber}" class="panel-image" />
                ` : `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f0f0f0; color: #666;">
                        Panel ${panel.panelNumber}
                    </div>
                `}
                ${panel.dialog ? `
                    <div class="speech-bubble" style="top: 8px; left: 8px;">
                        ${panel.dialog}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    return html;
  }

  async exportToPDF(comic: Comic, options: ExportOptions): Promise<Buffer> {
    let browser;
    try {
      logger.info('Starting PDF export', { comicId: comic.id, title: comic.title });

      // Generate HTML
      const html = await this.generateComicHTML(comic);

      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      
      // Set content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Configure PDF options
      const pdfOptions: any = {
        format: options.paperSize === 'custom' ? undefined : options.paperSize.toUpperCase(),
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
      };

      if (options.paperSize === 'custom' && options.customSize) {
        pdfOptions.width = `${options.customSize.width}px`;
        pdfOptions.height = `${options.customSize.height}px`;
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info('PDF export completed', { comicId: comic.id, size: pdfBuffer.length });
      return pdfBuffer;

    } catch (error) {
      logger.error('PDF export failed', { comicId: comic.id, error });
      throw new AppError(`PDF export failed: ${(error as Error).message}`, 500);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async exportToPNG(comic: Comic, options: ExportOptions): Promise<Buffer> {
    let browser;
    try {
      logger.info('Starting PNG export', { comicId: comic.id, title: comic.title });

      // Generate HTML
      const html = await this.generateComicHTML(comic);

      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set viewport based on resolution
      const resolutionSettings = {
        low: { width: 800, height: 560, deviceScaleFactor: 1 },
        medium: { width: 1200, height: 840, deviceScaleFactor: 1.5 },
        high: { width: 1600, height: 1120, deviceScaleFactor: 2 },
        print: { width: 2400, height: 1680, deviceScaleFactor: 3 },
      };

      const resolution = resolutionSettings[options.resolution] || resolutionSettings.high;
      await page.setViewport(resolution);

      // Set content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for images to load
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete);
      }, { timeout: 30000 });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: resolution.width,
          height: resolution.height,
        },
      });

      logger.info('PNG export completed', { comicId: comic.id, size: screenshot.length });
      return screenshot as Buffer;

    } catch (error) {
      logger.error('PNG export failed', { comicId: comic.id, error });
      throw new AppError(`PNG export failed: ${(error as Error).message}`, 500);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async exportToJPEG(comic: Comic, options: ExportOptions): Promise<Buffer> {
    let browser;
    try {
      logger.info('Starting JPEG export', { comicId: comic.id, title: comic.title });

      // Generate HTML
      const html = await this.generateComicHTML(comic);

      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // Set viewport based on resolution
      const resolutionSettings = {
        low: { width: 800, height: 560, deviceScaleFactor: 1 },
        medium: { width: 1200, height: 840, deviceScaleFactor: 1.5 },
        high: { width: 1600, height: 1120, deviceScaleFactor: 2 },
        print: { width: 2400, height: 1680, deviceScaleFactor: 3 },
      };

      const resolution = resolutionSettings[options.resolution] || resolutionSettings.high;
      await page.setViewport(resolution);

      // Set content
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Wait for images to load
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.every(img => img.complete);
      }, { timeout: 30000 });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: options.resolution === 'print' ? 95 : 85,
        fullPage: false,
        clip: {
          x: 0,
          y: 0,
          width: resolution.width,
          height: resolution.height,
        },
      });

      logger.info('JPEG export completed', { comicId: comic.id, size: screenshot.length });
      return screenshot as Buffer;

    } catch (error) {
      logger.error('JPEG export failed', { comicId: comic.id, error });
      throw new AppError(`JPEG export failed: ${(error as Error).message}`, 500);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async exportComic(comic: Comic, options: ExportOptions): Promise<Buffer> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(comic, options);
      case 'png':
        return this.exportToPNG(comic, options);
      case 'jpeg':
        return this.exportToJPEG(comic, options);
      default:
        throw new AppError(`Unsupported export format: ${options.format}`, 400);
    }
  }
}