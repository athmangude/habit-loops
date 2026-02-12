import { FOLDER_NAME } from '../config/google';

export async function findOrCreateFolder(): Promise<string> {
  const response = await gapi.client.drive.files.list({
    q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  const createResponse = await gapi.client.drive.files.create({
    resource: {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return createResponse.result.id;
}

export async function findOrCreateSpreadsheet(
  folderId: string,
  year: number,
): Promise<string> {
  const name = `HabitLoops ${year}`;
  const response = await gapi.client.drive.files.list({
    q: `name='${name}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }

  const createResponse = await gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: { title: name },
    },
  } as unknown);

  const spreadsheetId = createResponse.result.spreadsheetId;

  // Move to the HabitLoops folder
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${gapi.client.getToken()?.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return spreadsheetId;
}
