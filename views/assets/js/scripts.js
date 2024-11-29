//SCRIPTS DA PAGINA DE SUPORTE, SÃO OS RELATÓRIOS
const User = require('../models/post'); // Importa o modelo User

function abrirModal(conteudo) {
  const modal = document.getElementById("modal");
  const modalText = document.getElementById("modalText");
  modalText.innerHTML = conteudo;
  modal.style.display = "block";
}

function fecharModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";
}

// Fechar modal ao clicar fora da janela
window.onclick = function(event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    fecharModal();
  }
}

// Fechar modal ao pressionar a tecla Esc
window.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {
    fecharModal();
  }
});





// Atualizando as funções dos relatórios para exibir no modal

async function totalUsuarios() {
  try {
    const response = await fetch('http://localhost:8081/usuarios');
    const data = await response.json();

    let message = `Total de usuários cadastrados: ${data.totalUsuarios}<br><br>\n\n`;
    data.users.forEach(user => {
      message += `Nome: ${user.name}<br> Tipo Sanguíneo: ${user.bloodType}<br> Idade: ${user.idade}<br><br>`;
    });

    abrirModal(message);
  } catch (error) {
    console.error('Erro ao buscar o total de usuários:', error);
    abrirModal('Erro ao buscar o total de usuários');
  }
}

async function mostrarUsuariosTop() {
  try {
    const response = await fetch('http://localhost:8081/relatorio/usuarios-top');
    const data = await response.json();

    let relatorio = "Usuários com mais doações realizadas (até 5):<br><br>";
    data.forEach((user, index) => {
      relatorio += `${index + 1}. Nome: ${user.name}<br>
                    Idade: ${user.idade}<br>
                    Tipo Sanguíneo: ${user.bloodType}<br>
                    Agendamentos: ${user.agendamentos}<br>
                    E-mail de contato: ${user.email}<br><br>`;
    });

    abrirModal(relatorio);
  } catch (error) {
    console.error('Erro ao buscar relatório de usuários top:', error);
    abrirModal('Erro ao buscar relatório de usuários top');
  }
}

async function faixaEtaria() {
  try {
      const response = await fetch('http://localhost:8081/relatorio/faixa-etaria');
      const data = await response.json();
      
      abrirModal(`Faixa etária dos usuários:<br>| 18 a 25 = ${data["18 a 25"]} |<br>| 26 a 59 = ${data["26 a 59"]} |<br>| 60+ = ${data["60+"]} |`);
  } catch (error) {
      console.error('Erro ao buscar a faixa etária:', error);
      abrirModal('Erro ao buscar a faixa etária');
  }
}

async function tiposMenosDoacoes() {
  try {
      const response = await fetch('http://localhost:8081/relatorio/tipos-sanguineos/menos-doacoes');
      const data = await response.json();
      const tipos = data.map(item => `${item.bloodType}: ${item.count}`).join(', ');
      abrirModal(`Tipos sanguíneos com menos doações: ${tipos}`);
  } catch (error) {
      console.error('Erro ao buscar tipos com menos doações:', error);
      abrirModal('Erro ao buscar tipos com menos doações');
  }
}

//COLLECTION POINT RELATÓRIO
async function totalHospitais() {
  try {
    const response = await fetch('http://localhost:8081/CollectionPointTotal');
    const data = await response.json();

    // Monta a mensagem com o total de hospitais
    let message = `Total de hospitais/postos de coleta cadastrados: ${data.totalHospitais}<br><br>\n\n`;

    // Adiciona os nomes e CNPJs de cada hospital
    data.collectionPoints.forEach(point => {
      message += `Nome: ${point.name};<br> CNPJ: ${point.cnpj};<br> Endereço: ${point.address}.<br><br>\n`;
    });

    // Exibe a mensagem no modal
    abrirModal(message);
  } catch (error) {
    console.error('Erro ao buscar o total de hospitais:', error);
    abrirModal('Erro ao buscar o total de hospitais');
  }
}

async function totalAgendamentos() {
  try {
    const response = await fetch('http://localhost:8081/ScheduleTotal');
    const data = await response.json();

    let message = `Total de doações agendadas: ${data.totalAgendamentos}<br><br>\n\n`;

    data.schedules.forEach(schedule => {
      const doador = schedule.user ? schedule.user.name : 'Doador não identificado'; // Nome do doador
      const tipoSanguineo = schedule.user ? schedule.user.bloodType : 'Tipo sanguíneo não informado'; // Tipo sanguíneo
      message += `Data prevista: ${schedule.dateScheduled}.<br> 
                  Doador: ${doador}.<br> 
                  Tipo Sanguíneo: ${tipoSanguineo}<br><br>\n`;
    });

    abrirModal(message);
  } catch (error) {
    console.error('Erro ao buscar o total de doações:', error);
    abrirModal('Erro ao buscar o total de doações');
  }
}


module.exports = { contarUsuarios };