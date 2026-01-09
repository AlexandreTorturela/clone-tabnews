#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include <string.h>
#include <stdlib.h>

#define BYTE_VALUES     256

/* -------------------------------------------------- */
/* Entropia a partir do histograma                    */
/* -------------------------------------------------- */
static double entropy_from_freq(uint64_t freq[], uint64_t total)
{
    if (total == 0)
        return 0.0;

    double H = 0.0;
    for (int i = 0; i < BYTE_VALUES; i++) {
        if (freq[i] > 0) {
            double p = (double)freq[i] / (double)total;
            H -= p * log2(p);
        }
    }
    return H;
}

#define MIN_LINE_SIZE 32
static double normalize_entropy(double H, uint64_t N)
{
    double H_eff;   /* entropia efetiva */
    double H_max;   /* máximo teórico correspondente */

    if (N == 0)
        return 0.0;

    /* -----------------------------
       Caso 1: linhas curtas
       ----------------------------- */
    if (N < MIN_LINE_SIZE)
    {
        /* peso de suavização */
        double p = (double)(MIN_LINE_SIZE - N) / (double)MIN_LINE_SIZE;

        /* suavização no domínio linear */
        H_eff = log2(pow(2.0, H) + p);

        /* máximo permitido para esse regime */
        H_max = log2((double)MIN_LINE_SIZE);
    }
    /* -----------------------------
       Caso 2: linhas longas
       ----------------------------- */
    else if (N > 256)
    {
        H_eff = H;
        H_max = 8.0;
    }
    /* -----------------------------
       Caso 3: regime intermediário
       ----------------------------- */
    else
    {
        H_eff = H;
        H_max = log2((double)N);
    }

    /* Normalização final garantida */
    if (H_max <= 0.0)
        return 0.0;

    double H_norm = H_eff / H_max;

    /* Clamp defensivo */
    if (H_norm < 0.0)
        H_norm = 0.0;
    else if (H_norm > 1.0)
        H_norm = 1.0;

    return H_norm;
}

/* -------------------------------------------------- */
/* Núcleo: opera sobre FILE*                          */
/* -------------------------------------------------- */
static double file_max_normalized_entropy_FILE(FILE *fp)
{
    uint64_t freq_line[BYTE_VALUES] = {0};
    uint64_t freq_file[BYTE_VALUES] = {0};

    uint64_t line_len = 0;
    uint64_t file_len = 0;

    double max_Hnorm_line = 0.0;
    int c;

    while ((c = fgetc(fp)) != EOF) {

        if (c != '\n') {
            freq_file[(unsigned char)c]++;
            file_len++;
        }

        freq_line[(unsigned char)c]++;
        line_len++;

        if (c == '\n') {
            double H = entropy_from_freq(freq_line, line_len);
            double Hnorm = normalize_entropy(H, line_len);
            if (Hnorm > max_Hnorm_line)
                max_Hnorm_line = Hnorm;

            memset(freq_line, 0, sizeof(freq_line));
            line_len = 0;
        }
    }

    if (line_len > 0) {
        double H = entropy_from_freq(freq_line, line_len);
        double Hnorm = normalize_entropy(H, line_len);
        if (Hnorm > max_Hnorm_line)
            max_Hnorm_line = Hnorm;
    }

    double H_file = entropy_from_freq(freq_file, file_len);
    double Hnorm_file = normalize_entropy(H_file, file_len);

    return (max_Hnorm_line > Hnorm_file)
           ? max_Hnorm_line
           : Hnorm_file;
}

/* -------------------------------------------------- */
/* Wrapper por caminho                                */
/* -------------------------------------------------- */
static double file_max_normalized_entropy(const char *path)
{
    FILE *fp = fopen(path, "rb");
    if (!fp)
        return -1.0;

    double result = file_max_normalized_entropy_FILE(fp);
    fclose(fp);
    return result;
}

/* -------------------------------------------------- */
/* MAIN                                               */
/* -------------------------------------------------- */
int main(int argc, char *argv[])
{
    double threshold = 1.0;
    int fail_mode = 0;
    int verbose = 0;

    int argi = 1;

    /* Parse de opções */
    while (argi < argc && argv[argi][0] == '-') {

        if (strcmp(argv[argi], "--") == 0) {
            argi++;
            break;
        }

        if (strcmp(argv[argi], "--threshold") == 0) {
            if (argi + 1 >= argc) {
                fprintf(stderr, "Erro: --threshold requer valor\n");
                return 2;
            }
            threshold = atof(argv[++argi]);
        }
        else if (strcmp(argv[argi], "--fail") == 0) {
            fail_mode = 1;
        }
        else if (strcmp(argv[argi], "--verbose") == 0) {
            verbose = 1;
        }
        else {
            fprintf(stderr, "Opção desconhecida: %s\n", argv[argi]);
            return 2;
        }
        argi++;
    }

    if (argi >= argc) {
        fprintf(stderr,
            "Uso: %s [--threshold X] [--fail] [--verbose] <arquivo>\n",
            argv[0]);
        return 2;
    }

    int violated = 0;

    for (; argi < argc; argi++) {

        double score = file_max_normalized_entropy(argv[argi]);

        if (score < 0.0) {
            perror(argv[argi]);
            return 2;
        }

        if (verbose) {
            printf("%-40s %.6f\n", argv[argi], score);
        }

        if (score >= threshold)
            violated = 1;
    }

    if (fail_mode && violated)
        return 1;

    return 0;
}
