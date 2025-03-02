// controllers/archiveControllers.js
const path = require('path');
const fs = require('fs');
const pool = require('../config/db'); // or your DB connection

async function createArchiveItem(req, res) {
    try {
      const userId = req.user.id;
      const { parent_id, name, is_folder } = req.body;
  
      // Basic validation
      if (!name) {
        return res.status(400).json({ error: "Missing name for folder/file" });
      }
  
      if (is_folder === "true") {
        // Insert a folder record in the DB
        const [result] = await pool.query(`
          INSERT INTO archives (user_id, parent_id, name, is_folder, date_modified)
          VALUES (?, ?, ?, ?, NOW())
        `, [
          userId,
          parent_id || null,  // parent_id can be null if root
          name,
          true
        ]);
  
        return res.status(201).json({
          id: result.insertId,
          message: "Folder created successfully"
        });
      }
  
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded or is_folder not set to 'true'"
        });
      }
  
      const filePath = "/uploads/archives/" + req.file.filename;
      const fileSize = req.file.size;
      const fileType = path.extname(req.file.originalname).replace(".", "");
  
      // 6) Insert file record in DB
      const [result] = await pool.query(`
        INSERT INTO archives
          (user_id, parent_id, name, is_folder, file_path, file_size, file_type, date_modified)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        userId,
        parent_id || null,
        req.file.originalname, // user-friendly name
        false,
        filePath,
        fileSize,
        fileType
      ]);
  
      return res.status(201).json({
        id: result.insertId,
        message: "File uploaded successfully"
      });
    } catch (error) {
      console.error("Error creating archive item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async function getArchives(req, res) {
    try {
      const userId = req.user.id;
      const { parent_id, search } = req.query;
  
      let query = `
        SELECT 
          a.id,
          a.name,
          a.is_folder,
          a.file_path,
          a.file_size,
          a.file_type,
          DATE_FORMAT(a.date_modified, '%Y-%m-%d %H:%i:%s') AS dateModified,
          (
            SELECT COUNT(*) 
            FROM archives 
            WHERE parent_id = a.id
          ) AS childCount
        FROM archives a
        WHERE a.user_id = ?
      `;
      const params = [userId];
  
      // If parent_id is provided, filter by parent_id
      if (parent_id) {
        query += ` AND (a.parent_id = ? OR (a.parent_id IS NULL AND ? IS NULL))`;
        params.push(parent_id, parent_id);
      } else {
        // If no parent_id => show root items
        query += ` AND a.parent_id IS NULL`;
      }
  
      // If search is provided, filter by name
      if (search) {
        query += ` AND a.name LIKE ?`;
        params.push(`%${search}%`);
      }
  
      // Optional ordering
      query += ` ORDER BY a.is_folder DESC, a.date_modified DESC`;
  
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching archives:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async function deleteArchiveItem(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const recursive = req.query.recursive === 'true';
  
      // 1) Find the item
      const [rows] = await pool.query(
        `SELECT * FROM archives WHERE id = ? AND user_id = ?`,
        [id, userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Item not found or not yours' });
      }
      const item = rows[0];
  
      // 2) If it's a folder
      if (item.is_folder) {
        // Check if folder is empty
        const [childRows] = await pool.query(`
          SELECT id, is_folder, file_path 
          FROM archives 
          WHERE parent_id = ? AND user_id = ?
        `, [id, userId]);
  
        // If folder not empty and user didn't confirm recursive
        if (childRows.length > 0 && !recursive) {
          return res.status(400).json({ 
            error: 'Folder not empty', 
            code: 'FOLDER_NOT_EMPTY'
          });
        }
  
        // If folder is empty or recursive is true, do a recursive delete
        if (recursive) {
          await deleteFolderRecursively(id, userId);
          return res.json({ message: 'Folder and its contents deleted successfully' });
        } else {
          // folder is empty => normal delete
          await pool.query(`DELETE FROM archives WHERE id = ?`, [id]);
          return res.json({ message: 'Folder deleted successfully' });
        }
  
      } else {
        // 3) It's a file, remove from disk
        if (item.file_path) {
          const diskPath = item.file_path.replace('/uploads/archives/', 'uploads/archives/');
          try {
            fs.unlinkSync(diskPath);
          } catch (err) {
            console.warn('Could not remove file from disk:', err);
          }
        }
        // Remove DB record
        await pool.query(`DELETE FROM archives WHERE id = ?`, [id]);
        return res.json({ message: 'File deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting archive item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Recursively delete a folder and all its children
  async function deleteFolderRecursively(folderId, userId) {
    // find child items
    const [childRows] = await pool.query(`
      SELECT id, is_folder, file_path 
      FROM archives 
      WHERE parent_id = ? AND user_id = ?
    `, [folderId, userId]);
  
    for (const child of childRows) {
      if (child.is_folder) {
        await deleteFolderRecursively(child.id, userId);
      } else {
        // it's a file
        if (child.file_path) {
          const diskPath = child.file_path.replace('/uploads/archives/', 'uploads/archives/');
          try {
            fs.unlinkSync(diskPath);
          } catch (err) {
            console.warn('Could not remove file:', err);
          }
        }
        await pool.query(`DELETE FROM archives WHERE id = ?`, [child.id]);
      }
    }
  
    // after children are removed, remove the folder itself
    await pool.query(`DELETE FROM archives WHERE id = ?`, [folderId]);
  }
  

module.exports = {
  createArchiveItem,
  getArchives,
  deleteArchiveItem
};
