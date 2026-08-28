const Block = require('../models/Block');
const Room = require('../models/Room');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ success: false, message: 'Query param "q" is required', error: { code: 'MISSING_QUERY' } });
    }

    const regex = new RegExp(escapeRegex(q), 'i');

    // Find matching blocks & departments first so rooms/faculty inside them
    // also surface even if the room/faculty name itself doesn't match the query.
    const [matchingBlocks, matchingDepartments] = await Promise.all([
      Block.find({ $or: [{ name: regex }, { code: regex }, { description: regex }] }).limit(10),
      Department.find({ $or: [{ name: regex }, { code: regex }, { hodName: regex }] })
        .populate('blockId', 'name')
        .limit(10),
    ]);

    const matchingBlockIds = matchingBlocks.map((b) => b._id);

    // Only widen rooms/faculty search using departments matched by NAME or CODE —
    // a match on hodName alone (e.g. searching a person's name) should surface the
    // department itself, but shouldn't pull in every other faculty member in it.
    const matchingDeptIds = matchingDepartments
      .filter((d) => regex.test(d.name) || (d.code && regex.test(d.code)))
      .map((d) => d._id);

    const [rooms, faculty] = await Promise.all([
      Room.find({
        verified: true,
        $or: [
          { name: regex },
          { roomNumber: regex },
          { type: regex },
          ...(matchingBlockIds.length ? [{ blockId: { $in: matchingBlockIds } }] : []),
          ...(matchingDeptIds.length ? [{ departmentId: { $in: matchingDeptIds } }] : []),
        ],
      })
        .populate('blockId', 'name')
        .populate('departmentId', 'name')
        .sort({ floorNumber: 1, roomNumber: 1 })
        .limit(20),
      Faculty.find({
        approvedForDisplay: true,
        $or: [
          { name: regex },
          { designation: regex },
          ...(matchingDeptIds.length ? [{ departmentId: { $in: matchingDeptIds } }] : []),
        ],
      })
        .populate('departmentId', 'name')
        .limit(20),
    ]);

    res.json({
      success: true,
      message: 'OK',
      data: {
        blocks: matchingBlocks,
        departments: matchingDepartments,
        rooms,
        faculty,
      },
    });
  } catch (err) {
    next(err);
  }
};