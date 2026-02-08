import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixJsonEncoding() {
  try {
    const inputPath = path.join(__dirname, '../gynecology_questions.json');
    const outputPath = path.join(__dirname, '../gynecology_import.json');
    
    // Read original file
    const content = fs.readFileSync(inputPath, 'utf8');
    const questions = JSON.parse(content);
    
    // Transform: question -> questionText
    const fixed = questions.map((q: any) => ({
      questionText: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE || '',
      correctAnswer: q.correctAnswer,
      questionType: q.questionType
    }));
    
    // Write with proper UTF-8 encoding
    fs.writeFileSync(outputPath, JSON.stringify(fixed, null, 2), 'utf8');
    
    console.log(`✅ Created ${outputPath}`);
    console.log(`   Questions: ${fixed.length}`);
    console.log(`\n📋 First question:`);
    console.log(`   ${fixed[0].questionText}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixJsonEncoding();
