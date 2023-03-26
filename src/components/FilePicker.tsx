// Portions of this file are Copyright 2021 Google LLC, and licensed under GPL2+. See COPYING.

import { CSSProperties, useContext } from 'react';
import { TreeSelect } from 'primereact/treeselect';
import TreeNode from 'primereact/treenode';
import { getParentDir, librariesFolder } from '../fs/filesystem';
import { ModelContext, FSContext } from './contexts';

export const isFileWritable = (path: string) => getParentDir(path) === '/home'

function listFilesAsNodes(fs: FS, path: string): TreeNode[] {
  const files: [string, string][] = []
  const dirs: [string, string][] = []
  for (const name of fs.readdirSync(path)) {
    if (name.startsWith('.')) {
      continue;
    }
    const childPath = `${path}/${name}`;
    const stat = fs.lstatSync(childPath);
    const isDirectory = stat.isDirectory();
    if (!isDirectory && !name.endsWith('.scad')) {
      continue;
    }
    (isDirectory ? dirs : files).push([name, childPath]);
  }
  [files, dirs].forEach(arr => arr.sort(([a], [b]) => a.localeCompare(b)));

  const nodes: TreeNode[] = []
  for (const [arr, isDirectory] of [[files, false], [dirs, true]] as [[string, string][], boolean][]) {
    for (const [name, path] of arr) {
      const children = isDirectory ? listFilesAsNodes(fs, path) : undefined;
      if (isDirectory && children!.length == 0) {
        continue;
      }
      nodes.push({
        // icon: path == '/home' ? 'pi-home' : ...
        icon: isDirectory ? 'pi pi-folder' : isFileWritable(path) ? 'pi pi-file' : 'pi pi-lock',
        label: name,
        data: path,
        key: path,
        children,
        selectable: !isDirectory // && (name == 'LICENSE' || name.endsWith('.scad') || name.endsWith('.scad')
      });
    }
  }
  return nodes;
}

export default function FilePicker({className, style}: {className?: string, style?: CSSProperties}) {
  const model = useContext(ModelContext);
  if (!model) throw new Error('No model');
  const state = model.state;

  const fs = useContext(FSContext);

  const fsItems = fs && [
    {
      icon: 'pi pi-home',
      label: 'User files',
      key: '/home',
      children: listFilesAsNodes(fs, '/home'),
      selectable: false
    },
    {
      icon: 'pi pi-database',
      label: 'Builtin libraries',
      key: librariesFolder,
      children: listFilesAsNodes(fs, librariesFolder),
      selectable: false
    },
  ] || [];

  return (
      <TreeSelect 
          className={className}
          title='OpenSCAD Playground Files'
          value={state.params.sourcePath}
          onChange={(e) => model.openFile(String(e.value))}
          // dropdownIcon="pi pi-folder-open"
          filter
          style={style}
          // style={{style}}
          options={fsItems} />
  )
}
