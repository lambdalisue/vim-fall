function! fall#internal#msgarea#hide() abort
  call s:hide_cursor()
  call s:hide_msgarea()
  redraw
endfunction

function! fall#internal#msgarea#show() abort
  call s:show_cursor()
  call s:show_msgarea()
  redraw
endfunction

if has('nvim')
  function! s:hide_msgarea() abort
    if exists('s:hl_msgarea')
      return
    endif
    let s:hl_msgarea = nvim_get_hl(0, #{ name: 'MsgArea' })
    let l:hl_normal = nvim_get_hl(0, #{ name: 'Normal' })
    if !has_key(l:hl_normal, 'bg')
      " guifg=NONE is not supported
      unlet! s:hl_msgarea
      return
    endif
    call nvim_set_hl(0, 'MsgArea', #{ fg: l:hl_normal.bg, bg: l:hl_normal.bg })
  endfunction

  function! s:show_msgarea() abort
    if !exists('s:hl_msgarea')
      return
    endif
    call nvim_set_hl(0, 'MsgArea', s:hl_msgarea)
    unlet s:hl_msgarea
  endfunction
else
  function! s:hide_msgarea() abort
    if exists('s:hl_msgarea')
      return
    endif
    let s:hl_msgarea = hlget('MsgArea')
    let l:hl_normal = hlget('Normal')
    if !has_key(l:hl_normal[0], 'guibg')
      " guifg=NONE is not supported
      unlet! s:hl_msgarea
      return
    endif
    call hlset([#{ name: 'MsgArea', guifg: l:hl_normal[0].guibg, guibg: l:hl_normal[0].guibg }])
  endfunction

  function! s:show_msgarea() abort
    if !exists('s:hl_msgarea')
      return
    endif
    call hlset(s:hl_msgarea)
    unlet s:hl_msgarea
  endfunction
endif

if has('nvim')
  function! s:hide_cursor() abort
    if exists('s:guicursor_saved')
      return
    endif
    let s:guicursor_saved = &guicursor
    silent! highlight FallTransparentCursor gui=strikethrough blend=100
    set guicursor+=a:FallTransparentCursor/lCursor
  endfunction

  function! s:show_cursor() abort
    if !exists('s:guicursor_saved')
      return
    endif
    set guicursor+=a:Cursor/lCursor
    silent! let &guicursor = s:guicursor_saved
    silent! unlet! s:guicursor_saved
  endfunction
elseif has('gui_running')
  function! s:hide_cursor() abort
    if exists('s:guicursor_saved')
      return
    endif
    let s:guicursor_saved = &guicursor
    set guicursor+=a:ver1
  endfunction

  function! s:show_cursor() abort
    if !exists('s:guicursor_saved')
      return
    endif
    let &guicursor = s:guicursor_saved
    unlet s:guicursor_saved
  endfunction
else
  function! s:hide_cursor() abort
    if exists('s:t_ve_saved')
      return
    endif
    let s:t_ve_saved = &t_ve
    set t_ve=
  endfunction

  function! s:show_cursor() abort
    if !exists('s:t_ve_saved')
      return
    endif
    let &t_ve = s:t_ve_saved
    unlet s:t_ve_saved
  endfunction
endif
