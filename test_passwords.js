const bcrypt = require('bcryptjs');

const hashes = {
  "admin@jobito.com": "$2b$12$cwangFL9V0tb/X4b.U08Se2fyIUQvtPtnfWa8EjZzTTOCsmAVdO4O",
  "ops@jobito.com": "$2b$12$ioHwjdHcJ85UFq7amFgQMuN7mD35htXoekYe7BLWBy9WVZ/WRt59m",
  "saif1012816@gmail.com": "$2b$12$Ni9h8sb5nXdKVOrhGggJWOYzyLidqu/EM6iE.W3lLM43c439g/kCm"
};

const candidatePasswords = [
  "Jobito@2026Strong",
  "Jobito@2026",
  "admin",
  "admin123",
  "saif",
  "saif123",
  "saif1012816",
  "123456",
  "12345678",
  "password",
  "Password123",
  "admin@jobito.com",
  "ops@jobito.com",
  "saif1012816@gmail.com"
];

async function main() {
  for (const [email, hash] of Object.entries(hashes)) {
    console.log(`Checking candidate passwords for ${email}...`);
    for (const password of candidatePasswords) {
      const match = await bcrypt.compare(password, hash);
      if (match) {
        console.log(`>>> MATCH FOUND for ${email}: "${password}"`);
      }
    }
  }
  console.log("Done checking.");
}

main();
