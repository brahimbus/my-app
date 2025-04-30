const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/shopdb";
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// MongoDB Events
mongoose.connection.on("connected", () =>
  console.log("Mongoose connected to DB")
);
mongoose.connection.on("error", (err) =>
  console.error("Mongoose connection error:", err)
);
mongoose.connection.on("disconnected", () =>
  console.log("Mongoose disconnected")
);

// Schemas
const clientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true },
  commands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Command" }],
});

const produitSchema = new mongoose.Schema({
  libelle: { type: String, required: true },
  pu: { type: Number, required: true },
});

const ligneCommandSchema = new mongoose.Schema({
  qte: { type: Number, required: true },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Produit",
    required: true,
  },
});

const commandSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  lignes: [ligneCommandSchema],
});

// Models
const Client = mongoose.model("Client", clientSchema);
const Produit = mongoose.model("Produit", produitSchema);
const Command = mongoose.model("Command", commandSchema);

// !!! just data test
const initializeData = async () => {
  try {
    const clientCount = await Client.countDocuments();
    if (clientCount > 0) {
      console.log("data already exists");
      return;
    }

    const client1 = await new Client({
      nom: "Ibrahim",
      age: 30,
      email: "ibrahim@example.com",
      commands: [],
    }).save();

    const client2 = await new Client({
      nom: "Ali",
      age: 25,
      email: "ali@example.com",
      commands: [],
    }).save();

    const produit1 = await new Produit({
      libelle: "Laptop",
      pu: 999.99,
    }).save();
    const produit2 = await new Produit({ libelle: "Mouse", pu: 29.99 }).save();

    const command1 = await new Command({
      client: client1._id,
      lignes: [
        { qte: 1, produit: produit1._id },
        { qte: 2, produit: produit2._id },
      ],
    }).save();

    const command2 = await new Command({
      client: client2._id,
      lignes: [{ qte: 3, produit: produit2._id }],
    }).save();

    await Client.findByIdAndUpdate(client1._id, {
      $push: { commands: command1._id },
    });

    await Client.findByIdAndUpdate(client2._id, {
      $push: { commands: command2._id },
    });

    console.log("Sample data initialized");
  } catch (err) {
    console.error("Error initializing data:", err);
  }
};

// Routes

// Get all clients
app.get("/clients", async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get commands by client
app.get("/commands/:clientId", async (req, res) => {
  try {
    const commands = await Command.find({
      client: req.params.clientId,
    }).populate("lignes.produit");
    res.json(commands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update quantity in a command line
app.patch("/commands/:commandId/ligne/:ligneId", async (req, res) => {
  try {
    const { qte } = req.body;
    if (qte < 0)
      return res.status(400).json({ message: "Quantity cannot be negative" });

    const command = await Command.findById(req.params.commandId);
    if (!command) return res.status(404).json({ message: "Command not found" });

    const ligne = command.lignes.id(req.params.ligneId);
    if (!ligne) return res.status(404).json({ message: "Line item not found" });

    ligne.qte = qte;
    await command.save();

    res.json(command);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start Server
const startServer = async () => {
  await connectDB();
  await initializeData();
  app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
  );
};

startServer();
