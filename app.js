const express = require('express')
const exphbs = require('express-handlebars');
const { User, Schedule } = require('./models/associations');
const hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    toBase64: function (buffer) {
      return buffer ? buffer.toString('base64') : '';
    }
  }
});
const { Op } = require('sequelize');
const router = express.Router();
const { format } = require('date-fns');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { Sequelize, sequelize } = require('./models/db');
const Chamados = require('./models/Chamados');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const session = require('express-session')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const app = express()
const port = process.env.PORT || 8081
const path = require('path')
const publicPath = path.join(__dirname, 'views')
const post = require('./models/post')
const CollectionPoint = require('./models/collectionPoint')
const db = require('./models/db')
const authUser = require('./middlewares/authUser')
const authCollectionPoint = require('./middlewares/authCollectionPoint')
require('dotenv').config();
app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: 'main',
    runtimeOptions: {
      allowedProtoProperties: {
        id1: true,
        tipoChamado: true,
        descricao: true,
        foto: true,
        status: true
      },
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      eq: function (a, b) {
        return a === b;
      },
      formatDate: function (date) {
        if (!date) {
          console.error('Data inválida recebida no helper formatDate:', date);
          return 'Data inválida'; // Retorna mensagem padrão
        }
      
        // Verifica se é uma string
        let parsedDate = date instanceof Date ? date : new Date(date);
      
        // Verifica se a data é válida após a conversão
        if (isNaN(parsedDate.getTime())) {
          console.error('Data inválida recebida no helper formatDate:', date);
          return 'Data inválida';
        }
      
        // Formata a data usando o `format` (certifique-se de ter instalado 'date-fns')
        const { format } = require('date-fns');
        return format(parsedDate, 'dd/MM/yyyy');      
      },
      toBase64: function (buffer) {
        return buffer ? buffer.toString('base64') : '';
      }
    }
  })
);
app.set('view engine', 'handlebars')
app.use('/', express.static(publicPath))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/', express.static(publicPath))
app.use('/signup', express.static(publicPath))
app.use('/assets', express.static('views/assets')); //transforma os assets em static, isso possibilita que eles sejam acessados de qualquer lugar
app.use('/assets', express.static(path.join(__dirname, 'views/assets')));
app.use(
  session({
    secret: 'sua_chave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
)

// Configuração do transporte SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL, // Email remetente (do .env)
    pass: process.env.AUTH_PASS  // Senha de aplicativo
  },
  debug: true, // RETIRAR ESSAS DUAS FUNÇÕES SE QUISER DESATIVAR OS LOGS DETALHADOS
  logger: true,
});

app.post('/send-email/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, message } = req.body;

  // Validação básica dos campos
  if (!name || !email || !message) {
    return res.status(400).send('Por favor, preencha todos os campos.');
  }

  try {
    // Envio de e-mail
    const mailOptions = {
      from: '"Horizon" <seu-email@gmail.com>',
      to: email,
      subject: `Resposta ao chamado #${id}`,
      html: `
        <p>Olá, ${name}!</p>
        <p>${message}</p>
        <p>Atenciosamente, Equipe Horizon.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado para ${email} sobre o chamado ${id}`);

    // Exclusão do chamado
    const chamado = await Chamados.destroy({ where: { id1: id } });
    if (chamado) {
      console.log(`Chamado ID ${id} excluído com sucesso.`);
      res.status(200).send('E-mail enviado e chamado excluído com sucesso!');
    } else {
      res.status(404).send('Chamado não encontrado.');
    }
  } catch (err) {
    console.error('Erro ao processar a solicitação:', err);
    res.status(500).send('Erro ao processar a solicitação.');
  }
});

app.delete('/delete-chamado/:id1', async (req, res) => {
  const { id1 } = req.params;

  try {
    const chamadoExcluido = await Chamados.destroy({ where: { id1 } });

    if (!chamadoExcluido) {
      return res.status(404).send('Chamado não encontrado.');
    }

    console.log(`Chamado ID ${id1} excluído com sucesso.`);
    res.send('Chamado excluído com sucesso!');
  } catch (err) {
    console.error('Erro ao excluir chamado:', err);
    res.status(500).send('Erro ao excluir chamado.');
  }
});

app.get('/Chamados', async (req, res) => {
  try {
    // Busca todos os chamados no banco de dados
    const chamados = await Chamados.findAll();
    // Renderiza a página e passa os chamados para o template
    res.render('Chamados', { chamados });
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    res.status(500).send('Erro ao carregar chamados');
  }
});

//configuração de usuario admin com todas permissões
(async () => {
  try {
      await User.sync({ alter: true }); // Garante que a tabela esteja atualizada sem perder dados

      // Verifica se o usuário admin já existe
      const adminExists = await User.findOne({ where: { email: 'admin@horizon.com.br' } });
      if (!adminExists) {
          // Define a senha e o número de rounds para gerar o hash
          const senhaAdmin = 'Adm@12345';
          const saltRounds = 10;

          // Criptografa a senha
          const senhaHash = await bcrypt.hash(senhaAdmin, saltRounds);

          // Cria o usuário admin com a senha hash
          await User.create({
              name: 'Admin User',
              email: 'admin@horizon.com.br',
              password: senhaHash, // Salva a senha criptografada
              role: 'admin',
              dataNascimento: '30/12/1992',
              idade: 30,
              cpf: '00000000000',
              address: 'Admin Street',
              cep: '00000000',
              bloodType: 'O+'
          });
          console.log("Usuário administrador criado com sucesso.");
      }
  } catch (error) {
      console.error("Erro ao sincronizar o modelo ou criar o admin:", error);
  }
})();

Chamados.sync()
  .then(() => {
    console.log('Tabela de Chamados criada ou já existente.');
  })
  .catch((error) => console.log('Erro ao sincronizar o modelo de Chamados:', error));

  app.post('/signup', function (req, res) {
    const saltRounds = 10;
    const { senha, dataNascimento, nome, cpf, email, endereco, cep, tipo_sanguineo } = req.body;

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(senha)) {
    return res
      .status(400)
      .send(
        'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial.'
      )
  }

    // Converta a data de nascimento para o formato `yyyy-mm-dd`
    const [day, month, year] = dataNascimento.split('/');
    const formattedBirthDate = new Date(`${year}-${month}-${day}`);

      // Calcule a idade a partir da data de nascimento
  const today = new Date();
  let idade = today.getFullYear() - formattedBirthDate.getFullYear();
  const monthDiff = today.getMonth() - formattedBirthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < formattedBirthDate.getDate())) {
    idade--;
  }

  // Verifique se a idade está dentro do intervalo permitido
  if (idade < 18 || idade > 69) {
    return res.status(400).send('A idade deve estar entre 18 e 69 anos.');
  }

  bcrypt.hash(senha, saltRounds, function (err, hash) {
    if (err) {
      console.log('Erro ao criptografar a senha:', err)
      return res.status(500).send('Erro ao criptografar a senha')
    }

    User.create({
      name: nome,
      idade: idade, // Insere a idade calculada
      dataNascimento: formattedBirthDate, // Armazena a data de nascimento no formato adequado
      cpf: cpf,
      email: email,
      password: hash,
      address: endereco,
      cep: cep,
      bloodType: tipo_sanguineo
    })
    .then(function () {
      console.log('Usuário cadastrado com sucesso!');
      res.redirect('/login');
    })
    .catch(function (error) {
      console.log('Erro ao cadastrar dados na entidade: ' + error);
      res.status(500).send('Erro ao cadastrar os dados');
    });
  });
});

app.post('/login', function (req, res) {
  // Busca o usuário no banco de dados pelo email
  User.findOne({ where: { email: req.body.email } })  // Remover o "post" antes de "User"
    .then(user => {
      if (!user) {
        // Se o usuário não for encontrado
        return res.status(404).send('Usuário não encontrado');
      }

      // Comparar a senha inserida com o hash da senha armazenada
      console.log("Senha inserida pelo usuário:", req.body.senha);
      console.log("Hash armazenado no banco:", user.password);

      bcrypt.compare(req.body.senha, user.password, function (err, result) {
        if (err) {
          console.log('Erro ao comparar as senhas:', err);
          return res.status(500).send('Erro no servidor');
        }

        if (result) {
          // Armazena informações do usuário na sessão
          req.session.userId = user.id;
          req.session.userEmail = user.email;
          console.log('Usuário logado com sucesso!');

          // Verificação de redirecionamento com base na função do usuário
          if (user.role === 'admin') {
            return res.redirect('/suporte'); // Redireciona o admin para /suporte
          } else {
            return res.redirect('/profile'); // Redireciona usuários normais para /profile
          }
        } else {
          // Se as senhas não coincidirem
          console.log("Senha incorreta.");
          res.status(401).send('Senha incorreta');
        }
      });
    })
    .catch(error => {
      console.log('Erro ao buscar o usuário no banco de dados:', error);
      res.status(500).send('Erro no servidor');
    });
});

app.post('/logout', function (req, res) {
  req.session.destroy(err => {
    if (err) {
      console.log('Erro ao encerrar sessão:', err)
      return res.status(500).send('Erro ao encerrar sessão')
    }
    res.redirect('/login')
  })
})

app.post('/profile/edit', function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login')
  }

  // Buscar o usuário pelo ID da sessão usando o modelo correto
  post
    .findByPk(req.session.userId) // Substitua User por post
    .then(function (user) {
      if (!user) {
        return res.status(404).send('Usuário não encontrado')
      }

      // Atualiza os dados do usuário com os dados enviados pelo formulário
      user.name = req.body.name;
      user.dataNascimento = req.body.dataNascimento; // Atualiza a data de nascimento
      user.email = req.body.email;
      user.cpf = req.body.cpf;
      user.address = req.body.address;
      user.cep = req.body.cep;
      user.bloodType = req.body.bloodType;

      // Salva as alterações no banco de dados
      return user.save()
    })
    .then(() => {
      // Redireciona o usuário de volta para a página de perfil após salvar
      res.redirect('/profile')
    })
    .catch(error => {
      console.error('Erro ao atualizar dados do usuário:', error)
      res.status(500).send('Erro ao atualizar perfil')
    })
})

app.post('/forgot-password', function (req, res) {
  const email = req.body.email

  post
    .findOne({ where: { email } })
    .then(function (user) {
      if (!user) {
        console.log('Usuário não encontrado')
        return res.status(404).send('Usuário não encontrado')
      }

      const token = crypto.randomBytes(32).toString('hex')
      const expiration = Date.now() + 3600000

      user.resetToken = token
      user.resetTokenExpiration = expiration

      return user.save().then(() => {
        const resetLink = `http://localhost:8081/reset-password?token=${token}`
        return transporter.sendMail({
          to: user.email,
          from: '"Horizon" <seu-email@gmail.com>',
          subject: 'Redefinição de Senha',
          html: `<p>Você solicitou a redefinição de senha.</p>
                 <p>Clique neste <a href="${resetLink}">link</a> para redefinir sua senha.</p>`
        })
      })
    })
    .then(function () {
      console.log('E-mail de redefinição enviado')
      res.send('E-mail de redefinição enviado')
    })
    .catch(function (error) {
      console.log(error)
      res
        .status(500)
        .send('Erro ao processar solicitação de redefinição de senha')
    })
})

app.post('/reset-password', function (req, res) {
  const { senha, token } = req.body

  // Buscar o usuário pelo token
  post
    .findOne({
      where: {
        resetToken: token,
        resetTokenExpiration: {
          [db.Sequelize.Op.gt]: Date.now() // Verificar se o token ainda está válido
        }
      }
    })
    .then(function (user) {
      if (!user) {
        return res.status(400).send('Token inválido ou expirado')
      }

      // Gerar o hash da nova senha
      return bcrypt.hash(senha, 10).then(function (hash) {
        user.password = hash // Atualizar a senha do usuário
        user.resetToken = null // Limpar o token de redefinição
        user.resetTokenExpiration = null // Limpar a expiração do token

        return user.save()
      })
    })
    .then(function () {
      console.log('Senha redefinida com sucesso!')
      res.redirect('/login')
    })
    .catch(function (error) {
      console.log('Erro ao redefinir a senha:', error)
      res.status(500).send('Erro ao redefinir a senha')
    })
})

app.post('/cancel-schedule/:id', async function (req, res) {
  const scheduleId = req.params.id;

  console.log('Tentando cancelar agendamento:', { scheduleId, userId: req.session.userId });

  try {
    // Buscar informações do agendamento antes de deletar
    const schedule = await Schedule.findOne({
      where: {
        id: scheduleId,
        userId: req.session.userId, // Garante que apenas o dono pode cancelar
      },
    });

    if (!schedule) {
      console.warn('Nenhum agendamento encontrado para cancelar.');
      return res.status(404).send('Agendamento não encontrado.');
    }

    // Buscar informações do usuário logado
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      console.error('Usuário não encontrado para envio de e-mail.');
      return res.status(404).send('Erro ao processar cancelamento.');
    }

    // Cancelar o agendamento
    await Schedule.destroy({
      where: { id: scheduleId, userId: req.session.userId },
    });

    console.log('Agendamento cancelado com sucesso!');

    // Configurar o transporte e o e-mail
    const mailOptions = {
      from: '"Horizon" <seu-email@gmail.com>',
      to: user.email,
      subject: 'Cancelamento de Agendamento',
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Informamos que seu agendamento foi cancelado com sucesso.</p>
        <p><strong>Data:</strong> ${schedule.dateScheduled}</p>
        <p><strong>Horário:</strong> ${schedule.timeScheduled}</p>
        <p>Se precisar, você pode reagendar uma nova data em nossa plataforma.</p>
        <p>Atenciosamente, Equipe Horizon.</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`E-mail enviado para ${user.email} sobre o cancelamento.`);
      res.redirect('/my-schedules'); // Redireciona para a lista de agendamentos
    } catch (error) {
      console.error('Erro ao enviar e-mail de cancelamento:', error);
      res.status(500).send('Cancelamento efetuado, mas houve um erro ao enviar o e-mail.');
    }
  } catch (error) {
    console.error('Erro ao processar cancelamento do agendamento:', error);
    res.status(500).send('Erro ao processar solicitação.');
  }
});

// POST para abrir um novo chamado
app.post('/abrir-chamado', upload.single('fotoChamado'), async (req, res) => {
  try {
    const { metodoChamado, descricaoChamado } = req.body;
    const foto = req.file ? req.file.buffer : null;

    // Cria o novo chamado no banco de dados
    await Chamados.create({
      tipoChamado: metodoChamado,
      descricao: descricaoChamado,
      foto,
      status: 'Aberto'
    });

    res.status(200).send({ message: 'Chamado aberto com sucesso!' });
  } catch (error) {
    console.error('Erro ao abrir o chamado:', error);
    res.status(500).send({ message: 'Erro ao abrir o chamado' });
  }
});

// GET para visualizar um chamado específico com a imagem em base64
router.get('/visualizar-chamado/:id', async (req, res) => {
  try {
    const chamado = await Chamados.findByPk(req.params.id);
    
    if (chamado && chamado.foto) {
      // Define o tipo de imagem dinamicamente (ajuste conforme necessário)
      const tipoImagem = req.file.mimetype || 'image/jpeg'; // Assumindo jpeg se indefinido
      
      // Converte imagem para base64
      const fotoBase64 = chamado.foto.toString('base64');
      res.send(`<img src="data:${tipoImagem};base64,${fotoBase64}" alt="Imagem do Chamado" />`);
    } else {
      res.send('Chamado ou imagem não encontrada');
    }
  } catch (error) {
    console.error('Erro ao exibir o chamado:', error);
    res.status(500).send('Erro ao exibir o chamado');
  }
});

module.exports = router;

app.get('/', function (req, res) {
  res.render('home')
})

app.get('/beneficios', function(req, res){
  res.render("beneficios")
})

app.get('/apoiadores', function(req, res){
  res.render("apoiadores")
})

app.get('/mitos', function(req, res){
  res.render("mitos")
})

app.get('/suporte', function(req, res){
  res.render("suporte")
})

app.get('/contato', function(req, res){
  res.render("contato")
})

app.get('/chamados', function(req, res){
  res.render("chamados")
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.get('/signup', function (req, res) {
  res.render('signup')
})

app.get('/forgot-password', function (req, res) {
  res.render('forgot-password')
})

app.get('/reset-password', function (req, res) {
  const token = req.query.token

  if (!token) {
    return res.status(400).send('Token de redefinição não encontrado')
  }

  res.render('reset-password', { token })
})

app.get('/profile', authUser, function (req, res) {
  // Verifica se o usuário está autenticado
  if (!req.session.userId) {
    return res.redirect('/login') // Redireciona para o login se não estiver logado
  }

  // Busca os dados do usuário no banco de dados
  post
    .findByPk(req.session.userId)
    .then(function (user) {
      if (!user) {
        return res.status(404).send('Usuário não encontrado')
      }

      // Converte o objeto Sequelize para um objeto simples
      const plainUser = user.get({ plain: true })

      // Renderiza a página de perfil, passando os dados do usuário
      res.render('profile', { user: plainUser })
    })
    .catch(error => {
      console.log('Erro ao buscar dados do usuário:', error)
      res.status(500).send('Erro ao carregar perfil')
    })
})

app.get('/profile/edit', authUser, function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login') // Redireciona para login se o usuário não estiver logado
  }

  // Use o modelo correto (post em vez de User)
  post
    .findByPk(req.session.userId)
    .then(user => {
      if (!user) {
        return res.status(404).send('Usuário não encontrado')
      }

      // Converte o objeto Sequelize para um objeto simples
      const plainUser = user.get({ plain: true })

      // Renderiza a página de edição com os dados do usuário
      res.render('edit-profile', { user: plainUser })
    })
    .catch(error => {
      console.error('Erro ao buscar dados do usuário:', error)
      res.status(500).send('Erro ao carregar a página de edição')
    })
})

app.get('/my-schedules', authUser, function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login') // Redireciona se não estiver logado
  }

  Schedule.findAll({
    where: {
      userId: req.session.userId // Filtrando pelos agendamentos do usuário logado
    },
    include: [
      {
        model: post,
        as: 'user', // Alias para o relacionamento com User
        attributes: ['name', 'email']
      },
      {
        model: CollectionPoint,
        as: 'collectionPoint', 
        attributes: ['name', 'address']
      }
    ]
  })
    .then(schedules => {
      const schedulesJson = schedules.map(schedule => schedule.toJSON())
      console.log('Agendamentos encontrados: ', schedulesJson) // Verifique o conteúdo de schedules
      res.render('my-schedules', { schedules: schedulesJson }) // Passa os dados para a view
    })
    .catch(error => {
      console.error('Erro ao carregar os agendamentos:', error)
      res.status(500).send('Erro ao carregar os agendamentos.')
    })
})

app.get('/schedule', authUser, function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login') // Redireciona para o login se não estiver logado
  }
  CollectionPoint.findAll()
    .then(collectionPoints => {
      const plainCollectionPoints = collectionPoints.map(cp =>
        cp.get({ plain: true })
      )

      // Renderiza a página de agendamento com os pontos de coleta
      res.render('schedule', { collectionPoints: plainCollectionPoints })
    })
    .catch(error => {
      console.error('Erro ao carregar a página de agendamento:', error)
      res.status(500).send('Erro ao carregar a página de agendamento')
    })
})

app.post('/schedule', async function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login'); // Redireciona se não estiver logado
  }

  const { collection_point_id, date_scheduled, time_scheduled } = req.body;

  if (!date_scheduled || !time_scheduled) {
    console.error('Data ou horário inválido:', date_scheduled, time_scheduled);
    return res.status(400).send('Por favor, preencha todos os campos obrigatórios.');
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar só a data
    const validDate = new Date(date_scheduled);

    if (validDate < today) {
      console.error('Tentativa de agendamento em data passada:', date_scheduled);
      return res.json({ error: 'Não é permitido agendar para datas anteriores a hoje.' });
    }

    const maxDate = new Date(today);
    maxDate.setMonth(today.getMonth() + 6); // Adiciona 6 meses à data atual

    if (validDate > maxDate) {
      console.error('Tentativa de agendamento em data posterior ao limite de 6 meses:', date_scheduled);
      return res.json({ error: 'Não é permitido agendar para datas posteriores a 6 meses a partir de hoje.' });
    }

    // Valida se o usuário tem agendamento nos últimos 60 dias
    const lastSchedule = await Schedule.findOne({
      where: { userId: req.session.userId },
      order: [['dateScheduled', 'DESC']], // Busca o agendamento mais recente
    });

    if (lastSchedule) {
      const lastDate = new Date(lastSchedule.dateScheduled);
      const diffInDays = Math.floor((validDate - lastDate) / (1000 * 60 * 60 * 24)); // Diferença em dias

      if (diffInDays < 60) {
        console.error('Tentativa de agendamento com intervalo inferior a 60 dias.');
        return res.status(400).json({
          error: 'Não é permitido agendar outra doação com menos de 60 dias de intervalo da última doação.',
        });
      }
    }

    // Cria o agendamento
    const schedule = await Schedule.create({
      userId: req.session.userId,
      collectionPointId: collection_point_id,
      dateScheduled: validDate,
      timeScheduled: time_scheduled,
    });

    console.log('Agendamento criado com sucesso!');

    const user = await User.findOne({ where: { id: req.session.userId } });
    if (!user) {
      console.error('Usuário não encontrado para enviar e-mail.');
      return res.status(404).send('Usuário não encontrado.');
    }

    const mailOptions = {
      from: '"Horizon" <seu-email@gmail.com>',
      to: user.email,
      subject: 'Confirmação de Agendamento',
      html: `
        <p>Olá, ${user.name}!</p>
        <p>Seu agendamento foi confirmado com sucesso!</p>
        <p><strong>Data:</strong> ${date_scheduled}</p>
        <p><strong>Horário:</strong> ${time_scheduled}</p>
        <p><strong>Orientações para sua doação:</strong></p>
        <ul>
          <li>Esteja em jejum de pelo menos 4 horas antes da doação.</li>
          <li>Evite alimentos gordurosos nas 24 horas que antecedem a doação.</li>
          <li>Leve um documento de identidade com foto.</li>
          <li>Evite o consumo de álcool nas 24 horas anteriores.</li>
        </ul>
        <p>E lembre-se! Essa doação pode salvar até 4 vidas :)</p>
        <p>Obrigado por contribuir com nosso banco de sangue!</p>
        <p>Atenciosamente, Equipe Horizon.</p>
        <p><em>Em caso de desistência, realize o cancelamento o quanto antes.</em></p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`E-mail enviado para ${user.email} sobre o agendamento.`);
      res.redirect('/my-schedules'); // Redireciona para a página de agendamentos
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      res.status(500).send('Agendamento salvo, mas houve um erro ao enviar o e-mail.');
    }
  } catch (error) {
    console.error('Erro ao processar agendamento:', error);
    res.status(500).send('Erro ao processar solicitação.');
  }
});

app.get('/screening', authUser, function (req, res) {
  if (!req.session.userId) {
    return res.redirect('/login') // Redireciona para o login se não estiver logado
  }
  res.render('screening')
})




app.post('/collection-point/signup', function (req, res) {
  const { name, cnpj, email, password, cep, address } = req.body

  bcrypt.hash(password, 10, function (err, hash) {
    if (err) {
      return res.status(500).send('Erro ao criptografar a senha')
    }

    CollectionPoint.create({
      name: name,
      cnpj: cnpj,
      email: email,
      password: hash,
      cep: cep,
      address: address
    })
      .then(function () {
        console.log('Collection Point cadastrado com sucesso!')
        res.redirect('/collection-point/login')
      })
      .catch(function (error) {
        console.log('Erro ao cadastrar Collection Point: ' + error)
        res.status(500).send('Erro ao cadastrar o Collection Point')
      })
  })
})

app.post('/collection-point/login', function (req, res) {
  const { email, senha } = req.body

  CollectionPoint.findOne({ where: { email: email } })
    .then(function (collectionPoint) {
      if (!collectionPoint) {
        return res.status(404).send('Collection Point não encontrado')
      }

      bcrypt.compare(
        senha,
        collectionPoint.password,
        function (err, result) {
          if (err) {
            console.log('Erro ao comparar as senhas:', err)
            return res.status(500).send('Erro no servidor')
          }

          if (result) {
            req.session.collectionPointId = collectionPoint.id
            console.log('Collection Point logado com sucesso!')
            res.redirect('/collection-point/dashboard')
          } else {
            res.status(401).send('Senha incorreta')
          }
        }
      )
    })
    .catch(function (error) {
      console.log('Erro ao buscar o Collection Point:', error)
      res.status(500).send('Erro no servidor')
    })
})

app.post('/collection-point/profile/edit', function (req, res) {
  if (!req.session.collectionPointId) {
    return res.redirect('/login')
  }

  const { name, cnpj, email, cep, address } = req.body

  // Atualiza os dados no banco
  CollectionPoint.update(
    { name, cnpj, email, cep, address },
    { where: { id: req.session.collectionPointId } }
  )
    .then(() => {
      res.redirect('/collection-point/profile') // Redireciona para o perfil após a atualização
    })
    .catch(error => {
      console.error('Erro ao atualizar ponto de coleta:', error)
      res.status(500).send('Erro ao atualizar o perfil do ponto de coleta')
    })
})

app.post('/collection-point/reset-password', function (req, res) {
  const { password, token } = req.body

  CollectionPoint.findOne({
    where: {
      resetToken: token,
      resetTokenExpiration: { [db.Sequelize.Op.gt]: Date.now() }
    }
  })
    .then(function (collectionPoint) {
      if (!collectionPoint) {
        return res.status(400).send('Token inválido ou expirado')
      }

      bcrypt.hash(password, 10, function (err, hash) {
        if (err) {
          console.log('Erro ao criptografar a nova senha:', err)
          return res.status(500).send('Erro ao criptografar a senha')
        }

        collectionPoint.password = hash
        collectionPoint.resetToken = null
        collectionPoint.resetTokenExpiration = null

        collectionPoint.save().then(function () {
          console.log('Senha redefinida com sucesso!')
          res.redirect('/collection-point/login')
        })
      })
    })
    .catch(function (error) {
      console.log('Erro ao redefinir a senha:', error)
      res.status(500).send('Erro ao redefinir a senha')
    })
})

app.get('/collection-point/signup', function (req, res) {
  res.render('collection-point-signup')
})

app.get('/collection-point/login', function (req, res) {
  res.render('collection-point-login')
})

app.get('/collection-point/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err)
      return res.status(500).send('Erro ao encerrar a sessão')
    }
    res.redirect('/login') // Redireciona para a página de login após o logout
  })
})

app.get('/collection-point/reset-password', function (req, res) {
  res.render('collection-point-reset-password')
})

app.get('/collection-point/profile', authCollectionPoint, function (req, res) {
  if (!req.session.collectionPointId) {
    return res.redirect('/login')
  }

  CollectionPoint.findByPk(req.session.collectionPointId)
    .then(collectionPoint => {
      if (!collectionPoint) {
        return res.status(404).send('Ponto de coleta não encontrado')
      }

      const plainCollectionPoint = collectionPoint.get({ plain: true })
      delete plainCollectionPoint.password // Remove a senha do objeto

      res.render('collection-point-profile', {
        collectionPoint: plainCollectionPoint
      })
    })
    .catch(error => {
      console.error('Erro ao buscar ponto de coleta:', error)
      res.status(500).send('Erro ao carregar perfil do ponto de coleta')
    })
})

app.get('/collection-point/profile/edit', authCollectionPoint, (req, res) => {
  if (!req.session.collectionPointId) {
    return res.redirect('/login') // Redireciona para login se não estiver autenticado
  }

  // Busca o ponto de coleta no banco de dados
  CollectionPoint.findByPk(req.session.collectionPointId)
    .then(collectionPoint => {
      if (!collectionPoint) {
        return res.status(404).send('Ponto de coleta não encontrado')
      }

      const plainCollectionPoint = collectionPoint.get({ plain: true })

      res.render('collection-point-edit-profile', {
        collectionPoint: plainCollectionPoint
      })
    })
    .catch(error => {
      console.error('Erro ao buscar ponto de coleta:', error)
      res.status(500).send('Erro ao carregar perfil para edição')
    })
})

app.get('/collection-point/dashboard', authCollectionPoint, (req, res) => {
  res.render('collection-point-dashboard')
})


//Rotas e funções da página de suporte
app.get('/models/scripts', (req, res) => {
  res.sendFile(path.join(__dirname, 'models', 'scripts'));
});

app.get('/views/assets', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'assets', 'images'));
});

//rotas do perfil de suporte para gerar relatórios. Provavelmente será removido depois
app.get('/Suporte', function (req, res) {
  res.render('Suporte')
})

app.get('/Chamados', async (req, res) => {
  try {
    const chamados = await Chamados.findAll(); // Busca todos os chamados
    res.render('chamados', { chamados }); // Envia para a página Handlebars
  } catch (error) {
    console.error('Erro ao carregar os chamados:', error);
    res.status(500).send('Erro ao carregar os chamados');
  }
});

app.get('/relatorio/usuarios-top', async (req, res) => {
  try {
    // Consulta para contar agendamentos por usuário
    const topUsers = await Schedule.findAll({
      attributes: [
        'userId',
        [Sequelize.fn('COUNT', Sequelize.col('userId')), 'agendamentos']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'idade', 'bloodType', 'email'] // Inclui também o tipo sanguíneo
        }
      ],
      group: ['userId', 'user.id'], // Agrupa pelo userId e os dados do usuário
      order: [[Sequelize.literal('agendamentos'), 'DESC']], // Ordena pelos agendamentos
      limit: 5 // Limita a 5 usuários (pode ajustar esse número)
    });

    const result = topUsers.map(user => ({
      name: user.user.name,
      idade: user.user.idade,
      bloodType: user.user.bloodType, // Adiciona o tipo sanguíneo
      agendamentos: user.dataValues.agendamentos,
      email: user.user.email
    }));

    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar usuários com mais agendamentos:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de usuários top" });
  }
});

//essa rota mostra APENAS os 4 tipos sanguineos com menos cadastros
app.get('/relatorio/tipos-sanguineos/menos-doacoes', async (req, res) => {
  try {
    const tiposSanguineos = await User.findAll({
      attributes: ['bloodType', [Sequelize.fn('COUNT', Sequelize.col('bloodType')), 'count']],
      group: ['bloodType'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('bloodType')), 'ASC']],
      limit: 4
    });

    console.log(tiposSanguineos);  // Verifique como os dados estão sendo retornados
    res.json(tiposSanguineos);
  } catch (error) {
    console.error("Erro ao calcular tipos sanguíneos com menos doações:", error);
    res.status(500).json({ error: 'Erro ao calcular tipos sanguíneos com menos doações' });
  }
});

app.use(express.json());

//rota para idade de cada usuario
app.get('/relatorio/faixa-etaria', async (req, res) => {
  try {
    const faixa1 = await User.count({ where: { idade: { [Op.between]: [18, 25] } } });
    const faixa2 = await User.count({ where: { idade: { [Op.between]: [26, 59] } } });
    const faixa3 = await User.count({ where: { idade: { [Op.gte]: 60 } } });

    console.log(`Faixa 18-25: ${faixa1}, Faixa 26-59: ${faixa2}, Faixa 60+: ${faixa3}`); // Log para verificar os valores

    res.json({ "18 a 25": faixa1, "26 a 59": faixa2, "60+": faixa3 });
  } catch (error) {
    console.error('Erro ao calcular faixa etária:', error); // Log do erro
    res.status(500).json({ error: 'Erro ao calcular faixa etária' });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    // Conta o total de usuários na tabela
    const count = await User.count();

    // Busca os nomes e tipos sanguíneos de todos os usuários
    const users = await User.findAll({
      attributes: ['name', 'bloodType', 'idade'], // Inclui apenas o nome e o tipo sanguíneo
    });

    // Retorna os dados no formato desejado
    res.json({
      totalUsuarios: count,
      users: users, // Inclui a lista de usuários com seus nomes e tipos sanguíneos
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
});

app.get('/CollectionPointTotal', async (req, res) => {
  try {
    // Busca o total de hospitais
    const count = await CollectionPoint.count();

    // Busca os nomes e CNPJs de todos os hospitais
    const collectionPoints = await CollectionPoint.findAll({
      attributes: ['name', 'cnpj', 'address'] // Seleciona apenas os campos necessários
    });

    res.json({
      totalHospitais: count,
      collectionPoints: collectionPoints // Inclui a lista com nomes e CNPJs
    });
  } catch (error) {
    console.error("Erro ao buscar hospitais:", error);
    res.status(500).json({ message: 'Erro ao buscar hospitais' });
  }
});


app.get('/ScheduleTotal', async (req, res) => {
  try {
    // Conta o total de agendamentos
    const count = await Schedule.count();

    // Busca os dados dos agendamentos junto com o nome do usuário e o tipo sanguíneo
    const schedules = await Schedule.findAll({
      attributes: ['dateScheduled', 'timeScheduled'], // Campos da tabela `schedule`
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'bloodType'] // Inclui o nome e o tipo sanguíneo do usuário
        }
      ]
    });

    res.json({
      totalAgendamentos: count,
      schedules: schedules // Inclui os agendamentos com os nomes dos doadores e tipos sanguíneos
    });
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ message: 'Erro ao buscar agendamentos' });
  }
});

app.get('/schedule-form', authUser, async (req, res) => {
  try {
    // Busca todos os pontos de coleta
    const collectionPoints = await CollectionPoint.findAll({
      attributes: ['id', 'name', 'address'], // Seleciona os campos necessários
    });

    // Converte para JSON simples se necessário
    const collectionPointsJson = collectionPoints.map(cp => cp.toJSON());

    // Renderiza o formulário e passa os pontos de coleta
    res.render('schedule-form', { collectionPoints: collectionPointsJson });
  } catch (error) {
    console.error('Erro ao carregar pontos de coleta:', error);
    res.status(500).send('Erro ao carregar o formulário de agendamento.');
  }
});

app.listen(port, function () {
  console.log(`Server listening on port ${port}`)
})
