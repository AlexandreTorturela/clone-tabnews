function status(request, response) {
  response.status(200).json({ chave: "Alunos do curso.dev são excelentes!" });
}

export default status;
