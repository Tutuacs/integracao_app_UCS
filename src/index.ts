import * as fs from "fs";
import * as readline from "readline";

const moviePath = "./movies.json";
const moviesPath = "./movies.csv";
const directorPath = "./directors.txt";

type movie = {
  title: string;
  year: number | undefined;
  director: string | undefined;
};

// Lê o arquivo de filmes
async function readMovies(): Promise<Map<string, { title: string, year?: number }>> {
  const movies = new Map<string, { title: string, year?: number }>();
  const fileStream = fs.createReadStream(moviesPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }

    const parts = line.split(";");
    if (parts.length < 5) continue;

    const [id, title, yearStr] = parts;

    if (!id || !title) continue;

    movies.set(id.trim(), {
      title: title.trim(),
      year: yearStr ? parseInt(yearStr.trim()) : undefined
    });
  }

  return movies;
}

// Lê o arquivo de diretores (usando movieID como chave!)
async function readDirectors(): Promise<Map<string, string>> {
  const directors = new Map<string, string>();
  const fileStream = fs.createReadStream(directorPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    const parts = line.split(",");
    if (parts.length < 2) continue;

    const [movieID, name] = parts;
    if (!movieID || !name) continue;

    directors.set(movieID.trim(), name.trim());
  }

  return directors;
}

// Normaliza título para ordenação
function normalizeTitle(title: string): string {
  const articleRegex = /^(.*),\s(The|A|An|La|Le|Les)$/i;
  const match = title.match(articleRegex);
  if (match) {
    return `${match[2]} ${match[1]}`.trim();
  }
  return title.trim();
}

// Gera o arquivo JSON final
async function generateJSON() {
  const moviesData = await readMovies();
  const directorsData = await readDirectors();

  const merged: movie[] = [];

  for (const [movieID, movieInfo] of moviesData) {
    const director = directorsData.get(movieID);
    merged.push({
      title: normalizeTitle(movieInfo.title),
      year: movieInfo.year,
      director: director? director: "Not specified",
    });
  }

  // Ordenar por título
  merged.sort((a, b) => a.title.localeCompare(b.title));

  // Salvar em JSON
  fs.writeFileSync(moviePath, JSON.stringify(merged, null, 2), "utf8");
  console.log("Arquivo JSON gerado com sucesso!");
}

generateJSON();
