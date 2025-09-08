import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';

export function startPulseRecording({ logger }) {
  const id = uuidv4();
  const dir = path.resolve(config.recording.outDir);
  
  // Создаем директорию если не существует
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const outfile = path.join(dir, `${id}.wav`);

  // Записываем системный звук через pulseaudio
  const args = [
    '-y',
    '-f', 'pulse',
    '-i', 'default',
    '-ac', '2',
    '-ar', '44100',
    '-acodec', 'pcm_s16le',
    outfile
  ];

  const ff = spawn('ffmpeg', args, { 
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  ff.stdout.on('data', (d) => logger.debug({ msg: d.toString() }));
  ff.stderr.on('data', (d) => logger.debug({ msg: d.toString() }));

  ff.on('error', (error) => {
    logger.error({ error }, 'FFmpeg error');
  });

  ff.on('exit', (code) => {
    if (code === 0) {
      logger.info({ outfile }, 'Recording completed successfully');
    } else {
      logger.warn({ code, outfile }, 'FFmpeg exited with non-zero code');
    }
  });

  logger.info({ outfile, pid: ff.pid }, 'Recording started');
  
  return { 
    stop: () => {
      if (ff && !ff.killed) {
        ff.kill('SIGINT');
      }
    }, 
    outfile, 
    pid: ff.pid 
  };
}

export async function stopRecording(rec) {
  if (rec && typeof rec.stop === 'function') {
    rec.stop();
  }
  
  // Даем время для завершения записи
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  return rec.outfile;
}
