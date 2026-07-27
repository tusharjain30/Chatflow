const express = require("express");
const router = express.Router();

const adminAuth = require("../../../middleware/adminAuth");
const validator = require("../../../middleware/validator");
const { createPermissionSchema } = require("../../../schema/super-admin/permission/create.schema");
const { assignPermissionSchema } = require("../../../schema/super-admin/permission/assignPermission.schema");
const { removePermissionSchema } = require("../../../schema/super-admin/permission/removePermission.schema");
const { getRolePermissionSchema } = require("../../../schema/super-admin/permission/getRolePermission.schema");
const { updatePermissionSchema } = require("../../../schema/super-admin/permission/updatePermission.schema");

const createPermissionRoute = require("./create");
const assignPermissionRoute = require("./assignPermission");
const listPermissionsRoute = require("./read");
const removePermissionRoute = require("./removePermission");
const getRolePermissionRoute = require("./getRolePermission");
const updatePermissionRoute = require("./update");

router.use("/create", adminAuth, validator(createPermissionSchema, "body"), createPermissionRoute);
router.use("/assign", adminAuth, validator(assignPermissionSchema, "body"), assignPermissionRoute);
router.use("/list", adminAuth, listPermissionsRoute);
router.use("/remove", adminAuth, validator(removePermissionSchema, "body"), removePermissionRoute);
router.use("/role/:roleId", adminAuth, validator(getRolePermissionSchema, "params"), getRolePermissionRoute);
router.use("/update", adminAuth, validator(updatePermissionSchema, "body"), updatePermissionRoute);

module.exports = router;