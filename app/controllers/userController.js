import dotenv from "dotenv";
import UserPreferencesService from "../services/userPreferences.service.js";
import { supabaseAdmin } from "../database.js";
dotenv.config();

class userController {
  static async register(req, res, next) {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
          error: {
            code: "internal_error",
            message:
              "SUPABASE_SERVICE_ROLE_KEY is required to create users from backend",
          },
        });
      }
      const { email, password } = req.validated || req.body || {};
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (error) {
        if (
          error.status === 422 ||
          error.message?.toLowerCase().includes("already")
        ) {
          return res
            .status(409)
            .json({ error: { code: "conflict", message: error.message } });
        }
        throw new Error(error.message);
      }

      return res.status(201).json({
        user: {
          id: data?.user?.id,
          email: data?.user?.email,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getPreferences(req, res, next) {
    try {
      const prefs = await UserPreferencesService.getOrCreate(
        req.auth.payload.sub,
      );
      res.status(200).json({
        preferences: {
          theme: prefs.theme,
          currency: prefs.currency,
          displayBulletPoints: prefs.display_bullet_points,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updatePreferences(req, res, next) {
    try {
      const body = req.validated || req.body || {};
      const prefs = await UserPreferencesService.update(
        req.auth.payload.sub,
        body,
      );
      res.status(200).json({
        preferences: {
          theme: prefs.theme,
          currency: prefs.currency,
          displayBulletPoints: prefs.display_bullet_points,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateColorscheme(req, res, next) {
    try {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
          error: {
            code: "internal_error",
            message:
              "SUPABASE_SERVICE_ROLE_KEY is required to update user metadata from backend",
          },
        });
      }

      const body = req.validated || req.body || {};
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        req.auth.payload.sub,
        {
          user_metadata: { colorscheme: body.colorscheme },
        },
      );
      if (error) throw new Error(error.message);
      return res.status(200).json({ colorscheme: body.colorscheme });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
      return next(error);
    }
  }

  // static async loginUser(req, res) {
  //   assert.ok('id' in req.body, 'A user ID is required');
  //   try {
  //     const { id } = req.body;
  //     const user = await User.findByPk(id);
  //     if (user) {
  //       res.status(200).json({ user });
  //     } else {
  //       res.status(404).json({ message: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  // static async registerUser(req, res) {
  //   try {
  //     const { name, email } = req.body;
  //     const user = await User.create({ name, email });
  //     res.status(201).json({ user });
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  // static async updateUser(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const { name, email } = req.body;
  //     const [updated] = await User.update({ name, email }, { where: { id } });
  //     if (updated) {
  //       const updatedUser = await User.findByPk(id);
  //       res.status(200).json({ user: updatedUser });
  //     } else {
  //       res.status(404).json({ message: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }

  // static async deleteUser(req, res) {
  //   try {
  //     const { id } = req.params;
  //     const deleted = await User.destroy({ where: { id } });
  //     if (deleted) {
  //       res.status(204).json();
  //     } else {
  //       res.status(404).json({ message: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.trace(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // }
}

export default userController;
