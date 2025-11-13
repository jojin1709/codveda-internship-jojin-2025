import User from "../models/user.js";

// Create user
export const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already exists" });

    const user = await User.create({ name, email });
    res.status(201).json({ message: "User created successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get users with optional search + pagination
export const getUsers = async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : "";
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = Math.max(parseInt(req.query.limit || "8"), 1);

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } }
          ]
        }
      : {};

    const count = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({ count, page, limit, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // If email changed, check uniqueness
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: "Email already in use" });
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;
    await user.save();
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
