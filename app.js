require('dotenv').config();

const express = require('express');

const LoggerMiddleware = require('./middlewares/logger')
const errorHandler = require('./middlewares/errorHandler')

const bodyParser = require('body-parser');

const fs = require('fs')
const path = require('path');
const userFilePath = path.join(__dirname, 'users.json')

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(LoggerMiddleware);


const PORT = process.env.PORT || 3000;

// GET, POST, PUT, DELETE, PATCH

app.get('/', (req, res) => {
  res.send(`
      <h1>Curso Express.js v1</h1>
      <p>Esto es una aplicación node.js con express.js</p>
      <p>Corre en el puerto: ${PORT}</p>
    `);
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`Mostrar información del usuario con ID: ${userId}`)
});

// http://localhost:3005/search?termino=expressjs&categoria=nodejs
app.get('/search', (req, res) => {
  const terms = req.query.termino || 'No especificado';
  const category = req.query.categoria || 'Todas';
  res.send(`
      <h2>Resultados de Busqueda:</h2>
      <p>Término: ${terms}</p>
      <p>Categoría: ${category}</p>
    `)
});

app.post('/form', (req, res) => {
  const name = req.body.nombre;
  const email = req.body.email;
  res.json({
    message: 'Datos recibidos',
    data: {
      name,
      email
    }
  })
})

app.post('/api/data', (req, res) => {
  const data = req.body;
  if(!data || Object.keys(data).length === 0){
    return res.status(400).json({ error: 'No se recibieron datos' });
  }
  res.status(200).json({ message: 'Datos JSON recibidos', data})
})

app.get('/users', (req, res) => {
  fs.readFile(userFilePath, 'utf-8', (err, data) => {
    if(err){
      return res.status(500).json({ error: 'Error con conexión de datos.' })
    }
    const users = JSON.parse(data)
    res.json(users);
  })
})

// CREAR USUARIO
app.post('/users', (req, res) => {
  const newUser = req.body;
  const { name, email } = newUser;

  if(!name || !email) return res.status(400).json({ error: 'Debe completar los campos.' })

  // Validación de email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValidEmail = emailRegex.test(email)
  if(!isValidEmail) return res.status(400).json({ error: 'El campo mail no es válido.'})

  // validación
  fs.readFile(userFilePath, 'utf-8', (err, data) => {
    if(err) {
      return res.status(500).json({ error: 'Error con conexión de datos.'})
    }
    const users = JSON.parse(data)
    users.push(newUser)
    
    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (err) => {
      if(err) {
        return res.status(500).json({ error: 'Error al guardar el usuario.'})
      }
      res.status(201).json(newUser)
    })
  })
})

// EDITAR USUARIO
app.put('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10)
  const updateUser = req.body;

  fs.readFile(userFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error con conexión de datos.' })

    let users = JSON.parse(data);
    users = users.map(user => (user.id === userId ? {...user, ...updateUser } : user ));

    fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar el usuario.'})
      res.json(updateUser);
    })
  })
})

// ELIMINAR USUARIO
app.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10)

  fs.readFile(userFilePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error con conexión de datos.' })

    let users = JSON.parse(data);
    if(typeof userId === 'number' && users.some(user => user.id === userId)){

      users = users.filter(user => user.id !== userId)

      fs.writeFile(userFilePath, JSON.stringify(users, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar el usuario.'})
        res.status(204).send()
      })

    } else {
      return res.status(500).json({ error: "El ID no existe." })
    }
  })
});



app.get('/error', (req, res, next) => {
  next(new Error('Error intencional'))
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
