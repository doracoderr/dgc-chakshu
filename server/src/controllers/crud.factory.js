// Shared CRUD for simple published-content models (Event, Program).
module.exports = function crud(Model, { populate = [], buildFilter = () => ({}), sort = {} } = {}) {
  const ok = (res, data, message = 'OK', status = 200) => res.status(status).json({ success: true, message, data });
  const notFound = (res) =>
    res.status(404).json({ success: false, message: 'Not found', error: { code: 'NOT_FOUND' } });
  const withPopulate = (q) => populate.reduce((acc, p) => acc.populate(p), q);

  return {
    list: async (req, res, next) => {
      try {
        ok(res, await withPopulate(Model.find({ published: true, ...buildFilter(req.query) })).sort(sort).lean());
      } catch (e) {
        next(e);
      }
    },
    listAdmin: async (req, res, next) => {
      try {
        ok(res, await withPopulate(Model.find()).sort(sort).lean());
      } catch (e) {
        next(e);
      }
    },
    get: async (req, res, next) => {
      try {
        const row = await withPopulate(Model.findOne({ _id: req.params.id, published: true })).lean();
        row ? ok(res, row) : notFound(res);
      } catch (e) {
        next(e);
      }
    },
    create: async (req, res, next) => {
      try {
        ok(res, await Model.create(req.body), 'Created', 201);
      } catch (e) {
        next(e);
      }
    },
    update: async (req, res, next) => {
      try {
        const row = await Model.findById(req.params.id);
        if (!row) return notFound(res);
        row.set(req.body);
        await row.save();
        ok(res, row, 'Updated');
      } catch (e) {
        next(e);
      }
    },
    remove: async (req, res, next) => {
      try {
        const row = await Model.findByIdAndDelete(req.params.id);
        row ? ok(res, row, 'Deleted') : notFound(res);
      } catch (e) {
        next(e);
      }
    },
  };
};
