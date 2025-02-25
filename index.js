const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const Handlebars = require('handlebars'); // Importa Handlebars

const app = express();

Handlebars.registerHelper('neq', function(a, b) {
  // Comparar a y b directamente
  return a !== b ? true : false; // Devuelve true o false dependiendo de si son diferentes
});

// Registrar el helper 'neq' para la comparación de desigualdad
Handlebars.registerHelper('neq', function(a, b) {
  return a !== b ? true : false; // Devuelve true si son diferentes, false si no lo son
});

// Configuración de Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta para procesar el formulario y guardar datos en un archivo JSON
app.post('/submit', (req, res) => {
  const data = req.body;

  // Mostrar los datos recibidos en la consola para depuración
  console.log("Datos recibidos:", JSON.stringify(data, null, 2));

  // Guardar los datos en un archivo JSON
  const filePath = path.join(__dirname, 'data.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  // Redirigir a la página de datos registrados
  res.redirect('/datos_registrados');
});

// Ruta para mostrar los datos registrados
app.get('/datos_registrados', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');

  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.render('datos_registrados', data); // Pasar los datos a la vista
  } else {
    res.send('No se encontraron datos registrados.');
  }
});

// Ruta principal para mostrar el formulario y cargar los choferes desde el archivo Excel
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'choferes.xlsx'); // Ruta al archivo Excel

  if (fs.existsSync(filePath)) {
    try {
      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);

      // Obtener la primera hoja del archivo Excel (para los choferes)
      const choferesSheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convertir la hoja a un formato JSON, obteniendo los datos como un array de arrays
      const choferesData = XLSX.utils.sheet_to_json(choferesSheet, { header: 1 }); // 'header: 1' para obtener el encabezado como una fila normal

      // Mapear los datos de los choferes
      const choferesList = choferesData.slice(1).map(row => ({  // Ignorar la primera fila (encabezado)
        id: row[0],    // Documento está en la columna A (índice 0)
        name: row[1],  // Nombre está en la columna B (índice 1)
        type: row[3]   // Tipo está en la columna D (índice 3)
      }));

      // Obtener la segunda hoja del archivo Excel (para los clientes)
      const clientesSheet = workbook.Sheets[workbook.SheetNames[1]];  // Cambiar a la segunda hoja

      // Convertir la hoja a un formato JSON, obteniendo los datos como un array de arrays
      const clientesData = XLSX.utils.sheet_to_json(clientesSheet, { header: 1 }); // 'header: 1' para obtener el encabezado como una fila normal

      // Concatenar las columnas A (código) y B (razón social) para cada cliente
      const clientesList = clientesData.slice(1).map(row => ({
        codigo: row[0],  // Código de cliente está en la columna A (índice 0)
        razonSocial: row[1],   // Razón social está en la columna B (índice 1)
        displayName: `${row[0]} - ${row[1]}` // Concatenamos A y B para mostrar
      }));

      console.log(choferesList); // Verificar que los datos de choferes se han mapeado correctamente
      console.log(clientesList); // Verificar que los datos de clientes se han mapeado correctamente

      // Pasar los datos de los choferes y clientes a la vista de formulario
      res.render('form', { title: 'Formulario de Registro', choferes: choferesList, clientes: clientesList });

    } catch (error) {
      console.error("Error al leer el archivo Excel:", error);
      res.status(500).send('Hubo un error al leer los datos de los choferes y clientes.');
    }
  } else {
    res.send('El archivo de choferes no se encuentra.');
  }
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
