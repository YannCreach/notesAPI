var axios = require("axios").default;
const dotenv = require('dotenv');
dotenv.config();

const audience_management = process.env.AUTH0_AUDIENCE_MANAGEMENT;
const domain = process.env.AUTH0_DOMAIN;
const m2mclientId = process.env.AUTH0_M2M_CLIENT_ID;
const m2mClientSecret = process.env.M2M_CLIENT_SECRET;


class userController {

  static async updateColorscheme(req, res){
 
    var optionsToken = {
      method: 'POST',
      url: `https://${domain}/oauth/token`,
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      data: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: m2mclientId,
        client_secret: m2mClientSecret,
        audience: audience_management
      })
    };
    
    axios.request(optionsToken).then(function (responseToken) {
      
      var optionsPatch = {
        method: 'PATCH',
        url: `${audience_management}users/${req.auth.payload.sub}`,
        headers: {Authorization: `Bearer ${responseToken.data.access_token}`, 'content-type': 'application/json'},
        data: {
          user_metadata: {colorscheme: req.body.colorscheme},
        }
      };
      axios.request(optionsPatch).then(function (responsePatch) {
        console.log(responsePatch.data.user_metadata);
      }).catch(function (errorPatch) {
        console.log(`PATCH NOK: ${errorPatch}`);
        res.status(500);
      });

    }).catch(function (errorToken) {
      console.log(`TOKEN NOK: ${errorPatch}`);
      res.status(500);
    });

    res.status(200).json({ colorscheme: req.body.colorscheme });

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

module.exports = userController;
