/*
* Author: Clement Delalande (https://github.com/iKlem)
* More informations on the github repo (https://github.com/ScreepsMods/screepsmod-gcltocpu)
* Version: 0.3.1
*/

module.exports = (config) => {
  const constants = config.common.constants,
    storage = config.common.storage,
    engine = config.engine;

  let gclMult = 1,
    gclLevel = 1,
    gclPow = 1,
    newCPU = 0,
    oldUsers;

  /**
  * Update the CPU with the change of GCL.
  *
  * @param {boolean} forceUpdate - Force the update instead of waiting a change.
  */
  function doUpdate() {
    if (engine) {
      oldUsers = engine.driver.getAllUsers;

      engine.driver.getAllUsers = function() {
        var promise = oldUsers.apply(this, Array.prototype.slice.call(arguments));

        return promise.then(result => {
          for(let user of result.ivm) {
            if(!user.bot) {
              gclLevel = Math.floor(Math.pow((user.gcl || 0) / gclMult, 1 / gclPow)) + 1,
              newCPU = gclLevel * 10 + 20
              if ((user.cpu === 100 && newCPU < user.cpu) || newCPU > user.cpu) {
                updateUser(user, newCPU);
              }
            }
          }
          return result;
        });
      }
    }
  };

  /**
  * Update the new cpu from the storage db
  *
  * @param {Object} user - The user to update
  * @param {number} cpu - The new value for the CPU
  */
  function updateUser(user, cpu) {
    if(storage) {
      console.log(`Updated maximum cpu to ${cpu} for user ${user.username}`);
      let retVal = storage.db.users.update({username: user.username}, {$set: {cpu: cpu}});
      if (retVal) {
        return true;
      }
    }
    return false;
  };

  // main (looping by the engine runners)
  if (constants) {
    gclMult = constants.GCL_MULTIPLY;
    gclPow = constants.GCL_POW;

    doUpdate();
  }

};
