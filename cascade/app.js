const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Establish connection to MongoDB
mongoose.connect('mongodb://localhost/attendance', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Define the child schema
const ChildSchema = new mongoose.Schema({
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parent',
    },
    name: String,
});

// Define the parent schema
const ParentSchema = new mongoose.Schema({
    name: String,
});

// Define the pre-hook middleware for the parent schema
ParentSchema.pre('remove', async function (next) {
    // Cascade delete child documents
    await Child.deleteMany({ parent: this._id });
    next();
});

// Create the Child and Parent models
const Child = mongoose.model('Child', ChildSchema);
const Parent = mongoose.model('Parent', ParentSchema);

// Express route for creating a parent and associated children
app.post('/parents', async (req, res) => {
    try {
        const parent = await Parent.create({ name: req.body.name });

        // Create child documents
        const children = req.body.children.map(child => ({
            parent: parent._id,
            name: child.name,
        }));

        await Child.create(children);

        res.status(201).json({ parent, children });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Express route for deleting a parent and associated children
app.delete('/parents/:id', async (req, res) => {
    try {
        const parent = await Parent.findById(req.params.id);

        if (!parent) {
            return res.status(404).json({ error: 'Parent not found' });
        }

        await Child.deleteMany({ parent: parent._id });
        await Parent.deleteOne({ _id: parent._id });

        res.status(200).json({ message: 'Parent and associated children deleted' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
